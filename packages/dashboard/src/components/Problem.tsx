'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export const Problem = () => {
  return (
    <section className="relative py-40 bg-[#06070a] overflow-hidden border-t border-white/5">
      <div className="container relative z-10">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-signal-green font-mono text-[10px] uppercase tracking-[0.3em] mb-6 font-bold"
          >
            The Context Debt
          </motion.div>
          <h2 className="text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.9] tracking-tight text-white mb-8">
            Why AI coding<br />
            <span className="text-white/20">feels broken.</span>
          </h2>
          <p className="max-w-xl mx-auto text-lg text-white/40">
            The bottleneck isn't the model. It's the data. Without persistent memory,
            every agent is just a stranger reading your code for the first time.
          </p>
        </div>

        {/* NON-GENERIC COMPARISON GRID */}
        <div className="grid lg:grid-cols-2 gap-px bg-white/5 rounded-3xl border border-white/5 overflow-hidden">

          {/* LEFT: THE OLD WAY */}
          <div className="bg-[#08090b] p-12 lg:p-20 relative">
            <div className="mb-12">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full">
                Traditional Agents
              </span>
            </div>

            <div className="space-y-10">
              <div className="group">
                <h4 className="text-white/80 font-bold mb-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  Stale Documentation
                </h4>
                <p className="text-white/30 text-sm leading-relaxed">
                  Your README was last updated 3 months ago. The agent is trying to use
                  a library you already swapped out for Supabase.
                </p>
              </div>

              <div className="group">
                <h4 className="text-white/80 font-bold mb-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  The Explainer's Tax
                </h4>
                <p className="text-white/30 text-sm leading-relaxed">
                  "No, we use a custom auth layer." "Wait, don't use that utility."
                  You spend 40% of your time correcting the agent.
                </p>
              </div>

              <div className="group opacity-50">
                <div className="p-6 rounded-2xl bg-black/50 border border-white/5 font-mono text-[11px] text-red-500/60 italic">
                  // TODO: Someone explain why we did this...
                  // I forgot, and Claude doesn't know either.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: THE CONTEXTLY WAY */}
          <div className="bg-[#0a0c10] p-12 lg:p-20 relative overflow-hidden group">
            {/* Subtle Green Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-signal-green/10 blur-[80px] -z-10 group-hover:bg-signal-green/20 transition-all duration-1000" />

            <div className="mb-12">
              <span className="text-[10px] font-mono text-signal-green/60 uppercase tracking-widest border border-signal-green/20 bg-signal-green/5 px-3 py-1 rounded-full font-bold">
                Contextly Protocol
              </span>
            </div>

            <div className="space-y-10">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="group"
              >
                <h4 className="text-white font-bold mb-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-green shadow-[0_0_10px_#34FFB3]" />
                  Living Project Brief
                </h4>
                <p className="text-white/50 text-sm leading-relaxed">
                  Contextly automatically maps your git history and merged decisions into a
                  live knowledge graph. The docs write themselves.
                </p>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group"
              >
                <h4 className="text-white font-bold mb-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-green shadow-[0_0_10px_#34FFB3]" />
                  Zero Corrections
                </h4>
                <p className="text-white/50 text-sm leading-relaxed">
                  Agents connect to our MCP server and "know" your architectural patterns instantly.
                  Code isn't just generated; it's aligned.
                </p>
              </motion.div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-signal-green/5 border border-signal-green/20 font-mono text-[11px] text-signal-green/80 flex items-center gap-4"
              >
                <div className="w-1 h-1 rounded-full bg-signal-green animate-ping" />
                <span>RAG Memory: auth_v2 patterns detected and synced.</span>
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
    </section>
  );
};
