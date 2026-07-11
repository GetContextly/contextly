'use client';

import React from 'react';
import { motion } from 'framer-motion';

const UPDATES = [
  {
    version: 'v0.1.2',
    date: 'Jan 28, 2025',
    title: 'Semantic Analyzer v2',
    description: 'We rebuilt the CLI analyzer to better identify "Intent" from git diffs. It now ignores chores and typo fixes, focusing purely on architectural decisions.',
    changes: [
      'New heuristic engine for commit classification',
      'Improved support for monorepos',
      'Fixed a bug with SSH-based git remotes'
    ]
  },
  {
    version: 'v0.1.1',
    date: 'Jan 25, 2025',
    title: 'MCP Protocol Stabilization',
    description: 'Updates to our MCP server to align with the latest protocol specs from Anthropic.',
    changes: [
      'Added query_decisions tool',
      'Implemented rate limiting for cloud MCP tokens',
      'Better error handling for invalid sessions'
    ]
  },
  {
    version: 'v0.1.0',
    date: 'Jan 20, 2025',
    title: 'Alpha Launch',
    description: 'The initial version of Contextly is now live in early access.',
    changes: [
      'CLI: init, sync, auth',
      'Cloud Dashboard: Project management',
      'MCP Server: Core intelligence engine'
    ]
  }
];

export default function ChangelogPage() {
  return (
    <main className="bg-[#06070a] min-h-screen text-white pt-32 pb-20">
      <div className="container max-w-4xl mx-auto">
        <header className="mb-20">
          <h1 className="heading-l mb-4">Changelog</h1>
          <p className="text-white/40 text-lg">Every update. Every decision. Recorded.</p>
        </header>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-white/10" />

          <div className="space-y-20">
            {UPDATES.map((update, i) => (
              <motion.div
                key={update.version}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-12"
              >
                {/* Dot */}
                <div className="absolute left-0 top-2 w-[31px] h-[31px] rounded-full bg-[#06070a] border-2 border-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-signal-green shadow-[0_0_10px_#34FFB3]" />
                </div>

                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-display font-bold">{update.title}</h2>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">{update.version}</span>
                  </div>
                  <span className="text-sm font-mono text-white/20">{update.date}</span>
                </div>

                <p className="text-white/50 leading-relaxed mb-8 max-w-2xl">{update.description}</p>

                <ul className="space-y-3">
                  {update.changes.map(change => (
                    <li key={change} className="flex gap-3 text-sm text-white/40">
                      <span className="text-signal-green/40">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
