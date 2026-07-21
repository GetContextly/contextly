import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the requester is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    const email = user.email;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const safeName = escapeHtml(name || 'Developer');

    // Dynamic import to avoid build-time issues if resend is not installed
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Contextly <welcome@getcontextly.dev>',
      to: [email],
      subject: 'Welcome to Contextly',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #06070a; color: white; border-radius: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to the context layer, ${safeName}.</h1>
          <p style="color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 30px;">
            You've successfully joined Contextly. Your AI agents are about to get a lot smarter.
          </p>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #34FFB3; margin-top: 0;">Quick Start</h3>
            <code style="display: block; background: black; padding: 12px; border-radius: 8px; color: #34FFB3; font-family: monospace;">
              npx contextly login &amp;&amp; npx contextly init &amp;&amp; npx contextly sync
            </code>
          </div>
          <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
            Contextly Inc.
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
