'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const EASE = [0.16, 1, 0.3, 1] as const;

export const Waitlist = () => {
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
  };

  return (
    <section id="waitlist" className="relative py-60 bg-[#06070a] overflow-hidden border-t border-white/5">
      {/* 1. Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-signal-green/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-12">
            <span className="text-signal-green font-mono text-[10px] uppercase tracking-[0.4em] font-bold block mb-8">
              Deployment Phase: Alpha
            </span>
            <h2 className="text-[clamp(2.5rem,8vw,6rem)] font-extrabold leading-[0.85] tracking-tighter text-white mb-10">
              Ready to sync?<br />
              <span className="text-white/20">The future is persistent.</span>
            </h2>
          </div>

          <div className="flex flex-col items-center gap-10">
            <p className="max-w-xl text-lg text-white/40 leading-relaxed">
              Start building with Contextly today. Connect your GitHub, sync your context,
              and give your agents the brain they deserve.
            </p>

            {/* THE NON-GENERIC ACTION BOX */}
            <div className="w-full max-w-md p-1 rounded-[32px] bg-gradient-to-b from-white/10 to-transparent">
              <div className="bg-[#0D0E13] rounded-[31px] p-10 border border-white/5 flex flex-col gap-6">
                <button
                  onClick={handleGitHubLogin}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm flex items-center justify-center gap-4 hover:bg-white/90 active:scale-[0.98] transition-all group"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.521-1.304.874-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Authenticate with GitHub</span>
                  <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-grow bg-white/5" />
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">or</span>
                  <div className="h-px flex-grow bg-white/5" />
                </div>

                <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/5">
                  <input
                    type="email"
                    placeholder="Enter email for early access"
                    className="bg-transparent flex-grow px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none"
                  />
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all">
                    Join
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-10">
              <div className="text-left">
                <div className="text-2xl font-bold text-white">2.4k+</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Beta Users</div>
              </div>
              <div className="h-8 w-[1px] bg-white/5" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Open Source</div>
              </div>
              <div className="h-8 w-[1px] bg-white/5" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">0ms</div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Context Drift</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative vertical scanner lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-white" />
        <div className="absolute top-0 bottom-0 right-[20%] w-[1px] bg-white" />
      </div>
    </section>
  );
};
