'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function InstallationsPage() {
  const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'contextly-dev';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="heading-m text-white mb-2">Installations</h1>
        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Connect your ecosystem</p>
      </div>

      <div className="grid gap-8">
        {/* GitHub App Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-[2.5rem] overflow-hidden border-white/5"
        >
          <div className="p-10 flex flex-col md:flex-row gap-10 items-start">
            <div className="w-20 h-20 rounded-3xl bg-[#24292e] flex items-center justify-center shrink-0">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold mb-4">GitHub Integration</h2>
              <p className="text-white/40 leading-relaxed mb-8">
                Install the Contextly GitHub App to enable automatic syncing of Pull Requests and Commits. This allows Contextly to stay up-to-date even when you're not using the CLI.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new`}
                  className="px-8 py-3 rounded-2xl bg-[#24292e] text-white font-bold hover:bg-[#2f363d] transition-all flex items-center gap-2"
                >
                  Configure on GitHub
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-signal-green" />
                  <span className="text-xs font-mono uppercase tracking-widest text-white/60">Ready to Connect</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.02] p-8 border-t border-white/5">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-6">Permissions Required</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Pull Requests', desc: 'Read access to parse context from descriptions.' },
                { name: 'Repository Contents', desc: 'Read access to analyze file structure.' },
                { name: 'Commit Statuses', desc: 'Read access to track build and test health.' },
                { name: 'Webhooks', desc: 'Receive real-time updates on push.' },
              ].map(p => (
                <li key={p.name} className="flex gap-4">
                  <span className="text-signal-green">✔</span>
                  <div>
                    <p className="text-xs font-bold text-white/80">{p.name}</p>
                    <p className="text-[10px] text-white/30">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Vercel Integration placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-[2.5rem] p-10 border-white/5 opacity-50 grayscale"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 115 100" fill="black">
                  <path d="M57.5 0L115 100H0L57.5 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Vercel Integration</h3>
                <p className="text-xs text-white/40">Sync deployment events with your project memory.</p>
              </div>
            </div>
            <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest">Coming Soon</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
