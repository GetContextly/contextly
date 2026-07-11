import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // RATE LIMITING (CSEC-002)
  const { data: isLimited } = await supabase.rpc('is_rate_limited', {
    p_key: `stripe_webhook_${ip}`,
    p_window_seconds: 60,
    p_max_requests: 100
  });

  if (isLimited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // PAYLOAD SIZE LIMIT (CSEC-004)
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe signature or endpoint secret');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Update user profile with subscription status
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          stripe_subscription_id: subscriptionId,
          plan_type: 'pro' // Logic based on price ID
        })
        .eq('stripe_customer_id', customerId);

      if (error) console.error('Error updating profile on checkout:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled', plan_type: 'free' })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
