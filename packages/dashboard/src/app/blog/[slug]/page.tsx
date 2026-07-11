'use client';

import React, { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CONTENT: Record<string, any> = {
  'death-of-stale-docs': {
    title: 'The Death of the Stale README',
    date: 'Jan 24, 2025',
    tag: 'Philosophy',
    content: `
      <p>Every developer has lived through it: the frustration of opening a README only to realize the "Setup" instructions are for a version of the library that hasn't existed since 2022.</p>
      <h2>The Document Paradox</h2>
      <p>We write documentation because we want to help others (and our future selves). But the moment code changes, documentation begins to rot. In high-velocity teams, a README is often obsolete before the PR is merged.</p>
      <h2>Enter Semantic Intent</h2>
      <p>Contextly solves this by capturing "Semantic Intent" directly from your Git workflow. Instead of asking developers to manually update a central hub, we parse the commits and PRs as they happen.</p>
      <p>By shifting the burden from manual writing to automated extraction, we ensure that the project's memory is as fresh as the code itself.</p>
    `
  },
  'mcp-is-the-new-standard': {
    title: 'MCP: The New Standard for AI Context',
    date: 'Jan 22, 2025',
    tag: 'Technical',
    content: `
      <p>AI agents are powerful, but they are only as good as the context they can access. Until now, every agent (Claude, Cursor, Copilot) had to invent its own way of reading a codebase.</p>
      <h2>What is MCP?</h2>
      <p>The Model Context Protocol (MCP) is an open standard that allows AI models to securely and efficiently query external data sources. Contextly is built as an MCP server, meaning it speaks the native language of next-generation AI tools.</p>
      <h2>Why it Matters</h2>
      <p>With Contextly, you don't just give an agent files; you give it an architectural brain. It can ask "Why did we choose Supabase?" and get a reasoned answer based on past decisions.</p>
    `
  },
  'switching-agents-seamlessly': {
    title: 'Stop Explaining Your Code to Claude',
    date: 'Jan 15, 2025',
    tag: 'Guide',
    content: `
      <p>Switching from Cursor to Claude Code usually means spending 10 minutes re-explaining your project's architecture, tech stack, and recent refactors. It's the "Explainer's Tax," and it's killing your productivity.</p>
      <h2>Persistence is Key</h2>
      <p>Contextly creates a persistent memory layer that exists outside of any single agent session. When you switch tools, the new agent simply queries the Contextly MCP server and picks up exactly where the last one left off.</p>
      <h2>The Workflow</h2>
      <ol>
        <li>Run <code>contextly sync</code> after a refactor.</li>
        <li>Open your next agent session.</li>
        <li>The agent automatically reads the latest architectural brief.</li>
      </ol>
    `
  }
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = CONTENT[slug];

  if (!post) return <div className="p-20 text-center text-white/40 font-mono">Post not found.</div>;

  return (
    <main className="bg-[#06070a] min-h-screen text-white pt-40 pb-20">
      <div className="container max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/blog" className="text-signal-green text-xs font-mono mb-8 inline-block hover:underline">
            ← Back to Blog
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <span className="px-3 py-1 rounded-full bg-signal-green/10 text-signal-green text-[10px] font-mono uppercase tracking-widest">{post.tag}</span>
            <span className="text-white/20 text-xs font-mono">{post.date}</span>
          </div>

          <h1 className="heading-l mb-12">{post.title}</h1>

          <div
            className="prose prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-white/60 prose-p:leading-relaxed prose-p:text-lg prose-h2:text-white prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-20 pt-10 border-t border-white/5">
            <div className="glass-dark rounded-[2rem] p-10 text-center">
              <h3 className="text-2xl font-display font-bold mb-4">Never explain your project again.</h3>
              <p className="text-white/40 mb-8 max-w-md mx-auto">Join 2,400+ developers using Contextly to build smarter AI context.</p>
              <button className="px-8 py-4 rounded-2xl bg-signal-green text-black font-bold shadow-[0_0_20px_rgba(52,255,179,0.3)]">
                Join the Waitlist
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
