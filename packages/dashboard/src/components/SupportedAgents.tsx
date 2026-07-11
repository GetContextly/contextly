'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AGENTS = [
  { name: 'Claude Code', icon: 'CL' },
  { name: 'Cursor', icon: 'CU' },
  { name: 'GitHub Copilot', icon: 'GC' },
  { name: 'Windsurf', icon: 'WS' },
  { name: 'Zed', icon: 'ZE' },
  { name: 'Cody', icon: 'CO' },
  { name: 'Supermaven', icon: 'SM' },
  { name: 'Continue', icon: 'CN' },
];

export const SupportedAgents = () => {
  return (
    <section className="relative py-32 bg-[#06070a] overflow-hidden">
      <div className="container relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.9] tracking-tight text-white mb-6">
              One source of truth.<br />
              <span className="text-white/20">Every agent.</span>
            </h2>
          </div>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mb-4">
            Unified MCP Protocol Support
          </p>
        </div>

        {/* THE NON-GENERIC GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative bg-[#06070a] p-12 flex flex-col items-center justify-center gap-6 hover:bg-white/[0.02] transition-colors"
            >
              {/* Pulsing background effect */}
              <div className="absolute inset-0 bg-signal-green/0 group-hover:bg-signal-green/[0.02] transition-colors duration-500" />

              <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-bold text-white/20 group-hover:text-signal-green group-hover:border-signal-green/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(52,255,179,0.1)]">
                {agent.icon}
              </div>

              <span className="text-xs font-mono uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                {agent.name}
              </span>

              {/* Scanning line effect on hover */}
              <div className="absolute left-0 right-0 h-[1px] bg-signal-green/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 top-0" />
              <div className="absolute left-0 right-0 h-[1px] bg-signal-green/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 bottom-0" />
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="px-6 py-3 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Protocol Version</span>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-[10px] font-mono text-signal-green font-bold uppercase tracking-widest">MCP 1.2 Stable</span>
          </div>
        </div>
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute inset-0 flex justify-around pointer-events-none opacity-[0.03]">
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
        <div className="w-[1px] h-full bg-white" />
      </div>
    </section>
  );
};
