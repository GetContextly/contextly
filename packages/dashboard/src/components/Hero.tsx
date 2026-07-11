'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

// Terminal lines
type TerminalLineData = {
  type: 'cmd' | 'blank' | 'info' | 'success' | 'label' | 'agent' | 'prompt-end';
  content?: string;
  highlights?: string[];
  status?: string;
};

const TERMINAL_LINES: TerminalLineData[] = [
  { type: 'cmd',        content: '$ contextly init' },
  { type: 'info',       content: '  Scanning repository...' },
  { type: 'success',    content: '  Detected Next.js · Supabase · TypeScript', highlights: ['Next.js', 'Supabase', 'TypeScript'] },
  { type: 'success',    content: '  (142 files) Parsed 38 commits', highlights: ['142 files', '38 commits'] },
  { type: 'blank' },
  { type: 'info',       content: '  Linking to Contextly cloud...' },
  { type: 'success',    content: '  Project registered: proj_8f2a1c9e', highlights: ['proj_8f2a1c9e'] },
  { type: 'success',    content: '  MCP server configured' },
  { type: 'blank' },
  { type: 'label',      content: '  Your agents are ready.' },
  { type: 'agent',      content: '    Claude Code',      status: 'connected' },
  { type: 'agent',      content: '    Cursor',           status: 'connected' },
  { type: 'agent',      content: '    Windsurf',         status: 'connected' },
  { type: 'prompt-end' },
];

function TerminalLineView({ line }: { line: TerminalLineData }) {
  if (line.type === 'blank') return <div className="h-2" aria-hidden="true" />;

  if (line.type === 'cmd') {
    return (
      <div className="flex items-baseline gap-2 py-0.5">
        <span className="text-signal-green/90 font-bold">$</span>
        <span className="text-white/90">{line.content?.replace('$ ', '')}</span>
      </div>
    );
  }

  if (line.type === 'prompt-end') {
    return (
      <div className="flex items-baseline gap-2 py-0.5">
        <span className="text-signal-green/90 font-bold">$</span>
        <span className="w-2 h-4 bg-signal-green animate-pulse" />
      </div>
    );
  }

  if (line.type === 'success') {
    const text = line.content ?? '';
    return (
      <div className="flex items-baseline gap-2 py-0.5">
        <span className="text-signal-green text-[10px] leading-none">✔</span>
        <span className="text-white/50">{text.trimStart()}</span>
      </div>
    );
  }

  if (line.type === 'info') {
    return (
      <div className="flex items-baseline py-0.5">
        <span className="text-white/30">{line.content?.trimStart()}</span>
      </div>
    );
  }

  if (line.type === 'label') {
    return (
      <div className="flex items-baseline py-0.5">
        <span className="text-white/70 font-medium">{line.content?.trimStart()}</span>
      </div>
    );
  }

  if (line.type === 'agent') {
    return (
      <div className="flex items-baseline gap-3 py-0.5">
        <span className="text-white/20 text-[8px]">◆</span>
        <span className="text-white/60 w-32">{line.content?.trimStart()}</span>
        <span className="text-signal-green/70 text-[11px]">connected</span>
      </div>
    );
  }

  return null;
}

export const Hero = () => {
  const prefersReduced = useReducedMotion();
  const [email, setEmail] = useState('');

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background elements */}
      <div className="mesh-gradient" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT: Content */}
          <div className="max-w-xl">
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Contextly v0.1 &bull; Alpha</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} className="heading-xl mb-6">
              <span className="text-gradient">Stop re-explaining</span>
              <br />
              <span className="text-gradient-green italic">your project.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
              One CLI command gives Claude Code, Cursor, and Copilot a living project brief — auto-updated from git. Switch tools without losing the thread.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-grow max-w-sm">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-signal-green/50 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="px-8 py-4 rounded-2xl bg-signal-green text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(52,255,179,0.3)]">
                Join the waitlist
              </button>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="flex items-center gap-4 text-white/30 font-mono text-xs">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#06070a] bg-surface" />
                ))}
              </div>
              <span>2,400+ devs already in</span>
            </motion.div>
          </div>

          {/* RIGHT: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
            className="relative hidden lg:block"
          >
            {/* Terminal Window */}
            <div className="glass-dark rounded-3xl p-1 shadow-2xl animate-float">
              <div className="bg-[#0D0E13] rounded-[22px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-8 px-6 py-4 border-b border-white/5 bg-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="text-[11px] font-mono text-white/30">bash — contextly init</div>
                </div>

                {/* Content */}
                <div className="p-8 font-mono text-sm leading-relaxed min-h-[400px]">
                  {TERMINAL_LINES.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1), duration: 0.5 }}
                    >
                      <TerminalLineView line={line} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-signal-green/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-accent-blue/10 rounded-full blur-[100px] -z-10" />

            {/* Agent Badges Floating */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-12 glass px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded bg-white/10" />
              <span className="text-xs font-medium text-white/80">Claude Code</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-1/2 -right-12 glass px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-signal-green/20" />
              <span className="text-xs font-medium text-white/80">Cursor</span>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
