'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for individual side projects.',
    features: [
      '3 Projects',
      'Basic Semantic Analysis',
      'Local MCP Server',
      '20 Syncs per month',
      'Community Support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: '$19',
    interval: '/mo',
    description: 'For professional developers and small teams.',
    features: [
      'Unlimited Projects',
      'Advanced Intent Extraction',
      'Cloud MCP Hosting (Low Latency)',
      'Unlimited Syncs',
      'Priority Support',
      'GitHub App Integration'
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    priceId: 'price_pro_monthly'
  },
  {
    name: 'Team',
    price: '$49',
    interval: '/mo',
    description: 'Scale context across your entire engineering org.',
    features: [
      'Everything in Pro',
      'Shared Team Memory',
      'SSO / SAML',
      'Audit Logs',
      'Custom Deployment Options',
      'Dedicated Success Manager'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingPage() {
  const handleCheckout = async (priceId?: string) => {
    if (!priceId) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout failed', err);
    }
  };

  return (
    <main className="bg-[#06070a] min-h-screen text-white pt-32 pb-20 overflow-hidden">
      <div className="mesh-gradient opacity-30" />

      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-l mb-6"
          >
            Simple, <span className="text-white/30 italic">developer-friendly</span> pricing.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/40 font-mono uppercase tracking-widest"
          >
            Context is free. Scaling it is professional.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-dark rounded-[2.5rem] p-10 border-white/5 flex flex-col ${plan.popular ? 'border-signal-green/30 ring-1 ring-signal-green/20' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-signal-green text-black text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(52,255,179,0.4)]">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-display font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/30 text-sm font-mono">{plan.interval}</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="text-signal-green mt-0.5">✔</span>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => plan.priceId ? handleCheckout(plan.priceId) : (window.location.href = '/login')}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.popular
                    ? 'bg-signal-green text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(52,255,179,0.2)]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid gap-6">
            <div className="glass-dark rounded-2xl p-6 border-white/5">
              <h4 className="font-bold mb-2">Can I self-host the project memory?</h4>
              <p className="text-sm text-white/40">Yes. The MCP server and analyzer are open source. The cloud dashboard is for teams who want zero-latency sync and hosted security.</p>
            </div>
            <div className="glass-dark rounded-2xl p-6 border-white/5">
              <h4 className="font-bold mb-2">Does Contextly see my source code?</h4>
              <p className="text-sm text-white/40">No. We only store the "intent" (descriptions of changes) and specific architectural decisions you sync. Your raw source code stays on your machine.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
