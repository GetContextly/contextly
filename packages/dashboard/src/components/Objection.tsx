'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Objection = () => {
  return (
    <section className="relative py-40 bg-signal-green overflow-hidden">
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-black">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] uppercase tracking-[0.4em] mb-12 font-black opacity-40"
          >
            The Critical Shift
          </motion.div>

          <h2 className="text-[clamp(2rem,6vw,4.5rem)] font-black leading-[0.9] tracking-tighter mb-12">
            "I'll just explain it to the agent myself."
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-end">
            <p className="text-2xl font-bold leading-tight tracking-tight opacity-80">
              Manual documentation is a lie we tell ourselves during onboarding.
              After 4 merged PRs, your hand-crafted summary is already legacy code.
            </p>
            <div className="space-y-6">
              <p className="text-lg font-medium opacity-60">
                Contextly is the ground truth that stays current — automatically.
                Stop babysitting your agents. Let them lead.
              </p>
              <div className="h-px w-full bg-black/10" />
              <div className="flex gap-12">
                <div>
                  <div className="text-4xl font-black">0.0s</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">Maintenance</div>
                </div>
                <div>
                  <div className="text-4xl font-black">100%</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
    </section>
  );
};
