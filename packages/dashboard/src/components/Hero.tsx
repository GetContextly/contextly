'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export const Hero = () => {
  const { scrollY } = useScroll();
  const [email, setEmail] = useState('');

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, -150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-20 pb-32 overflow-hidden bg-[#06070a]">
      {/* 1. BACKGROUND TEXT */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none"
      >
        <h2 className="text-[30vw] font-black leading-none uppercase tracking-tighter text-white">
          SYNC
        </h2>
      </motion.div>

      {/* 2. GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-signal-green/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-muted-violet/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-20 flex flex-col items-center text-center">
        {/* 3. EYEBROW */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 flex items-center gap-3 px-4 py-2 rounded-full glass border-white/5 bg-white/5 backdrop-blur-md"
        >
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-signal-green/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-signal-green/20" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase font-bold">
            Project Persistence Layer v0.1
          </span>
        </motion.div>

        {/* 4. HEADLINE */}
        <motion.div style={{ scale, opacity }}>
          <h1 className="text-white font-display text-center mb-10 max-w-4xl">
            <motion.span
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="block text-[clamp(2.5rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]"
            >
              Building is fast.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              className="block text-[clamp(2.5rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-white/40"
            >
              Explaining is slow.
            </motion.span>
          </h1>
        </motion.div>

        {/* 5. SUBTEXT */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-2xl text-xl text-white/40 leading-relaxed mb-12"
        >
          Contextly gives your AI agents a persistent memory of your architecture, decisions,
          and intent. Stop the "Explainer's Loop" once and for all.
        </motion.p>

        {/* 6. ACTION BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          className="w-full max-w-md group"
        >
          <div className="relative p-[1px] rounded-[24px] bg-gradient-to-b from-white/10 to-transparent">
            <div className="relative flex items-center p-1.5 rounded-[23px] bg-[#0D0E13] border border-white/5">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow bg-transparent px-6 py-4 text-white placeholder:text-white/20 outline-none font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="bg-signal-green text-black px-8 py-4 rounded-[18px] font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(52,255,179,0.15)]">
                Secure Access
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
            <span className="hover:text-white/40 transition-colors cursor-default">No Credit Card</span>
            <span className="h-[3px] w-[3px] rounded-full bg-signal-green/30"></span>
            <span className="hover:text-white/40 transition-colors cursor-default">Open MCP Standard</span>
            <span className="h-[3px] w-[3px] rounded-full bg-signal-green/30"></span>
            <span className="hover:text-white/40 transition-colors cursor-default">Unlimited Repos</span>
          </div>
        </motion.div>
      </div>

      {/* 7. FLOATING PERSPECTIVE TERMINAL */}
      <motion.div
        style={{ y: y2 }}
        initial={{ opacity: 0, y: 80, rotateX: 20 }}
        animate={{ opacity: 1, y: 40, rotateX: 10 }}
        transition={{ duration: 1.5, delay: 0.9, ease: EASE }}
        className="relative w-full max-w-6xl mt-24 px-6 perspective-[2000px]"
      >
        <div className="relative transform-gpu transition-transform duration-700 hover:rotate-x-0">
          <div className="glass-dark rounded-3xl p-[1px] shadow-[0_60px_100px_rgba(0,0,0,0.6)] border-white/5 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-signal-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="bg-[#050608]/95 rounded-[23px] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/5">
                <div className="flex gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/5" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/5" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/5" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[9px] font-mono text-white/20 tracking-[0.2em] font-bold">
                    CTX_DAEMON_STREAM
                  </div>
                  <div className="h-4 w-[1px] bg-white/5" />
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-signal-green animate-pulse" />
                    <div className="text-signal-green/60 text-[9px] font-mono font-bold">LIVE</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-12 font-mono text-[13px] leading-relaxed text-white/30 h-[380px] overflow-hidden relative">
                <div className="animate-terminal-scroll space-y-2">
                  <p className="text-white/60">$ contextly sync --target="packages/dashboard"</p>
                  <p className="text-signal-green/80 flex items-center gap-2">
                    <span className="animate-bounce">↓</span> Initializing neural context map...
                  </p>
                  <div className="h-12" />
                  <div className="space-y-1">
                    <p className="flex justify-between">
                      <span>[ANALYZING] src/components/Hero.tsx</span>
                      <span className="text-white/10">DONE</span>
                    </p>
                    <p className="flex justify-between">
                      <span>[ANALYZING] src/app/api/auth/route.ts</span>
                      <span className="text-white/10">DONE</span>
                    </p>
                    <p className="flex justify-between">
                      <span>[ANALYZING] supabase/migrations/2026_init.sql</span>
                      <span className="text-white/10">DONE</span>
                    </p>
                    <p className="flex justify-between">
                      <span>[ANALYZING] .github/workflows/deploy.yml</span>
                      <span className="text-white/10 text-signal-green/40 italic">UPDATED</span>
                    </p>
                  </div>
                  <div className="h-8" />
                  <p className="text-white/60">[GIT] Detected 4 unmapped decisions in recent commits</p>
                  <p className="pl-4">↳ commit_7f2a: "Migrated from Redux to Zustand for simplicity"</p>
                  <p className="pl-4">↳ commit_9e11: "Added pgvector for semantic search implementation"</p>
                  <div className="h-8" />
                  <p className="text-muted-violet/60">[RAG] Generating embeddings (Voyage-Code-2)...</p>
                  <p className="text-muted-violet/60">[RAG] Vector storage sync (Supabase) ... 100%</p>
                  <div className="h-8" />
                  <p className="text-signal-green font-bold">✓ 142 files indexed. MCP server ready for agents.</p>
                  <p className="text-white/40 italic mt-6">Claude Code connected. Index up to date.</p>
                  <p className="text-white/60 mt-4">$ _</p>
                </div>
                {/* Visual Fades */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes terminal-scroll {
          0% { transform: translateY(0); }
          50% { transform: translateY(-40px); }
          100% { transform: translateY(0); }
        }
        .animate-terminal-scroll {
          animation: terminal-scroll 15s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
