'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const POSTS = [
  {
    slug: 'death-of-stale-docs',
    title: 'The Death of the Stale README',
    excerpt: 'Why manual documentation is a technical debt factory and how semantic intent capture fixes it.',
    date: 'Jan 24, 2025',
    tag: 'Philosophy',
    image: '◈'
  },
  {
    slug: 'mcp-is-the-new-standard',
    title: 'MCP: The New Standard for AI Context',
    excerpt: 'Understanding the Model Context Protocol and why we built Contextly as an MCP server.',
    date: 'Jan 22, 2025',
    tag: 'Technical',
    image: '✦'
  },
  {
    slug: 'switching-agents-seamlessly',
    title: 'Stop Explaining Your Code to Claude',
    excerpt: 'A guide on how to keep your context persistent when switching between Cursor, Claude Code, and Copilot.',
    date: 'Jan 15, 2025',
    tag: 'Guide',
    image: '⚡'
  }
];

export default function BlogPage() {
  return (
    <main className="bg-[#06070a] min-h-screen text-white pt-32 pb-20">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <header className="mb-20 text-center">
            <h1 className="heading-l mb-6">The <span className="text-white/30 italic">Contextly</span> Blog</h1>
            <p className="text-white/40 text-sm font-mono uppercase tracking-[0.3em]">Engineering Intent & AI Architecture</p>
          </header>

          <div className="grid gap-12">
            {POSTS.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <Link href={`/blog/${post.slug}`} className="block glass-dark rounded-[3rem] p-10 border-white/5 hover:border-signal-green/20 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 text-8xl font-black text-white/[0.02] group-hover:text-signal-green/[0.05] transition-colors pointer-events-none">
                    {post.image}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="px-3 py-1 rounded-full bg-signal-green/10 text-signal-green text-[10px] font-mono uppercase tracking-widest">{post.tag}</span>
                      <span className="text-white/20 text-xs font-mono">{post.date}</span>
                    </div>

                    <h2 className="text-3xl font-display font-bold mb-4 group-hover:text-signal-green transition-colors">{post.title}</h2>
                    <p className="text-white/40 leading-relaxed mb-8 max-w-2xl">{post.excerpt}</p>

                    <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-4 transition-all">
                      Read Article <span className="text-signal-green">→</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
