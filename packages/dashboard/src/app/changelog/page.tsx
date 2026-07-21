'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const UPDATES = [
  {
    version: 'v0.5.0',
    date: 'Jul 21, 2025',
    title: 'Full Stack Rewrite',
    description: 'Complete rewrite of CLI, MCP server, and dashboard. API contract alignment across all packages.',
    changes: [
      'CLI: GitHub Device Flow auth, auto-login on init, improved heuristic analyzer',
      'MCP Server: 5 contract-matching tools (get_context, explain_file, recent_changes, log_decision, get_project_brief)',
      'Dashboard: Auth middleware, project management, admin panel, billing integration',
      'Webhooks: Auto-sync on push, PR merge tracking, heuristic decision extraction',
      'Shared: 37 dead files removed, type alignment with API contract',
    ],
  },
  {
    version: 'v0.4.0',
    date: 'Jun 15, 2025',
    title: 'GitHub Integration',
    description: 'GitHub App installation webhooks, push event auto-sync, and PR merge tracking.',
    changes: [
      'GitHub App installation webhook handler',
      'Push event auto-sync with heuristic analysis',
      'PR merge logging as architectural decisions',
      'Installations page in dashboard',
    ],
  },
  {
    version: 'v0.3.0',
    date: 'May 10, 2025',
    title: 'Security Hardening',
    description: 'Multi-layered defense: SQL injection prevention, rate limiting, audit logging.',
    changes: [
      'Database-level rate limiting via RPC',
      'Input sanitization on all user-facing fields',
      'Audit log table for security events',
      'Webhook signature verification (HMAC-SHA256)',
    ],
  },
  {
    version: 'v0.2.0',
    date: 'Apr 1, 2025',
    title: 'MCP Protocol',
    description: 'Initial MCP server implementation with core query tools.',
    changes: [
      'MCP server with get_context and log_decision tools',
      'Supabase token-based authentication',
      'Schema validation with Zod',
    ],
  },
  {
    version: 'v0.1.0',
    date: 'Mar 1, 2025',
    title: 'Alpha Launch',
    description: 'The initial version of Contextly is now live in early access.',
    changes: [
      'CLI: init, sync, auth',
      'Cloud Dashboard: Project management',
      'Landing page with waitlist',
    ],
  },
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
          <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-white/10" />

          <div className="space-y-20">
            {UPDATES.map((update) => (
              <motion.div
                key={update.version}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-12"
              >
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
                  {update.changes.map((change) => (
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

        <div className="mt-20 text-center">
          <Link
            href="https://github.com/GetContextly/contextly/releases"
            className="text-signal-green text-sm hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View all releases on GitHub
          </Link>
        </div>
      </div>
    </main>
  );
}
