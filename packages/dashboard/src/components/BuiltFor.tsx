'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: EASE,
    },
  }),
};

const FileTreeVisual = () => (
  <div className="file-tree-visual">
    <div className="tree-line root">
      <span className="tree-icon">📁</span>
      <span className="tree-name">my-saas/</span>
    </div>
    <div className="tree-line indent-1">
      <span className="tree-branch">├──</span>
      <span className="tree-icon">📁</span>
      <span className="tree-name">src/</span>
    </div>
    <div className="tree-line indent-2">
      <span className="tree-branch">├──</span>
      <span className="tree-icon">📁</span>
      <span className="tree-name muted">app/</span>
    </div>
    <div className="tree-line indent-2">
      <span className="tree-branch">└──</span>
      <span className="tree-icon">📁</span>
      <span className="tree-name muted">lib/</span>
    </div>
    <div className="tree-line indent-1">
      <span className="tree-branch">└──</span>
      <span className="tree-icon">📁</span>
      <span className="tree-name accent">.contextly/</span>
    </div>
    <div className="tree-line indent-2">
      <span className="tree-branch">└──</span>
      <span className="tree-icon">📄</span>
      <span className="tree-name accent">memory.json</span>
      <span className="tree-check">✓</span>
    </div>
  </div>
);

const PRDiffVisual = () => (
  <div className="diff-visual">
    <div className="diff-header">
      <span className="diff-filename">src/lib/db.ts</span>
      <span className="diff-badge">ADR-012</span>
    </div>
    <div className="diff-body">
      <div className="diff-line removed">
        <span className="diff-gutter">-</span>
        <span className="diff-code">
          <span className="kw">import</span>
          {' { '}
          <span className="id-red">firebase</span>
          {" } from './firebase'"}
        </span>
      </div>
      <div className="diff-line added">
        <span className="diff-gutter">+</span>
        <span className="diff-code">
          <span className="kw">import</span>
          {' { '}
          <span className="id-green">supabase</span>
          {" } from './supabase'"}
        </span>
      </div>
      <div className="diff-line added">
        <span className="diff-gutter">+</span>
        <span className="diff-code comment">{'// Decision: migrated per ADR-012'}</span>
      </div>
      <div className="diff-line neutral">
        <span className="diff-gutter"> </span>
        <span className="diff-code muted">{'// Context synced by Contextly'}</span>
      </div>
    </div>
  </div>
);

const TerminalVisual = () => (
  <div className="terminal-visual">
    <div className="term-header">
      <div className="term-dots">
        <span className="dot dot-red" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
      </div>
      <span className="term-title">contextly — zsh</span>
    </div>
    <div className="term-body">
      <div className="term-line">
        <span className="term-prompt">$</span>
        <span className="term-cmd"> contextly status</span>
      </div>
      <div className="term-line">
        <span className="term-check">✓</span>
        <span className="term-key"> Memory: </span>
        <span className="term-val">142 decisions</span>
      </div>
      <div className="term-line">
        <span className="term-check">✓</span>
        <span className="term-key"> Last sync: </span>
        <span className="term-val">2 min ago</span>
      </div>
      <div className="term-line">
        <span className="term-check">✓</span>
        <span className="term-key"> Agents: </span>
        <span className="term-val">3 connected</span>
      </div>
    </div>
  </div>
);

export const BuiltFor = () => {
  const cards = [
    {
      tag: 'Solopreneurs',
      title: 'You are the whole team.',
      description:
        "When you're building alone, you're the architect, the dev, and the PM. Contextly ensures your AI agents know as much about the 'why' as you do.",
      visual: <FileTreeVisual />,
    },
    {
      tag: 'Fast-moving Teams',
      title: 'Ship without the onboarding tax.',
      description:
        'New team members and their AI tools get the full picture in seconds. Decisions, context, and ADRs are always one command away.',
      visual: <PRDiffVisual />,
    },
    {
      tag: 'Open Source',
      title: 'Community First.',
      description:
        'Contextly is built in the open. Project memory should be as portable as your code. No vendor lock-in — just pure, transferable context.',
      visual: <TerminalVisual />,
      cta: { label: 'View on GitHub', href: 'https://github.com/contextly' },
    },
  ];

  return (
    <section className="built-for">
      <div className="container">
        <motion.div
          className="header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-eyebrow">
            <span className="eyebrow-text">Who It's For</span>
          </div>
          <h2 className="section-heading">
            Built for the next<br />generation of shipping.
          </h2>
          <p className="section-sub">
            Whether you're a solo builder or a distributed team, Contextly keeps every agent in sync.
          </p>
        </motion.div>

        <div className="bento-grid">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className="card-outer"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={cardVariants}
            >
              <div className="card-inner">
                <div className="card-visual">
                  {card.visual}
                </div>
                <div className="card-text">
                  <span className="card-tag">{card.tag}</span>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-desc">{card.description}</p>
                  {card.cta && (
                    <a href={card.cta.href} className="card-cta" target="_blank" rel="noreferrer">
                      <span className="cta-label">{card.cta.label}</span>
                      <span className="cta-arrow-wrap">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ─── Section Shell ─────────────────────────────── */
        .built-for {
          padding: 128px 0;
          background: #0A0B0F;
          position: relative;
          overflow: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* ─── Header ────────────────────────────────────── */
        .header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .eyebrow-text {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #34FFB3;
          background: rgba(52, 255, 179, 0.08);
          border: 1px solid rgba(52, 255, 179, 0.2);
          border-radius: 9999px;
          padding: 6px 14px;
        }

        .section-heading {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #fff;
          margin-bottom: 20px;
        }

        .section-sub {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 1.0625rem;
          color: rgba(255, 255, 255, 0.5);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* ─── Bento Grid ────────────────────────────────── */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }

        /* ─── Double-Bezel Card ─────────────────────────── */
        .card-outer {
          border-radius: 2rem;
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          padding: 6px;
          transition: box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-outer:hover {
          box-shadow: 0 0 0 1px rgba(52, 255, 179, 0.2);
        }

        .card-inner {
          border-radius: calc(2rem - 6px);
          background: #12141C;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: background 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-outer:hover .card-inner {
          background: #14161F;
        }

        /* ─── Visual Area ───────────────────────────────── */
        .card-visual {
          background: #0D0E13;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 28px 28px;
          overflow: hidden;
        }

        /* ─── Card Text Area ────────────────────────────── */
        .card-text {
          padding: 28px 32px 32px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(255, 255, 255, 0.35);
          margin-bottom: 12px;
          display: block;
        }

        .card-title {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 1.3125rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-bottom: 12px;
        }

        .card-desc {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.7;
          margin-bottom: 0;
          flex: 1;
        }

        /* ─── CTA Button (Button-in-Button) ─────────────── */
        .card-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
          padding: 10px 10px 10px 18px;
          border-radius: 9999px;
          background: rgba(52, 255, 179, 0.08);
          border: 1px solid rgba(52, 255, 179, 0.18);
          color: #34FFB3;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background 300ms cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 300ms cubic-bezier(0.16, 1, 0.3, 1);
          align-self: flex-start;
        }

        .card-cta:hover {
          background: rgba(52, 255, 179, 0.14);
          border-color: rgba(52, 255, 179, 0.3);
        }

        .cta-label {
          line-height: 1;
        }

        .cta-arrow-wrap {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-cta:hover .cta-arrow-wrap {
          transform: translateX(2px) translateY(-1px) scale(1.05);
        }

        /* ─── File Tree Visual ──────────────────────────── */
        :global(.file-tree-visual) {
          font-family: var(--font-mono);
          font-size: 12.5px;
          line-height: 1.9;
          white-space: pre;
          width: 100%;
        }

        :global(.tree-line) {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        :global(.tree-line.root) {
          margin-bottom: 2px;
        }

        :global(.tree-line.indent-1) {
          padding-left: 16px;
        }

        :global(.tree-line.indent-2) {
          padding-left: 32px;
        }

        :global(.tree-branch) {
          color: rgba(255, 255, 255, 0.18);
          font-size: 11px;
        }

        :global(.tree-icon) {
          font-size: 12px;
          filter: grayscale(1) brightness(0.5);
        }

        :global(.tree-name) {
          color: rgba(255, 255, 255, 0.5);
        }

        :global(.tree-name.muted) {
          color: rgba(255, 255, 255, 0.3);
        }

        :global(.tree-name.accent) {
          color: rgba(52, 255, 179, 0.85);
        }

        :global(.tree-check) {
          color: #34FFB3;
          margin-left: 6px;
          font-size: 11px;
        }

        /* ─── PR Diff Visual ────────────────────────────── */
        :global(.diff-visual) {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        :global(.diff-header) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        :global(.diff-filename) {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
        }

        :global(.diff-badge) {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 500;
          padding: 2px 7px;
          border-radius: 9999px;
          background: rgba(124, 140, 255, 0.12);
          color: #7C8CFF;
          border: 1px solid rgba(124, 140, 255, 0.2);
        }

        :global(.diff-body) {
          padding: 10px 0;
          background: #080909;
        }

        :global(.diff-line) {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 2px 14px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          line-height: 1.75;
        }

        :global(.diff-line.removed) {
          background: rgba(255, 82, 82, 0.07);
        }

        :global(.diff-line.added) {
          background: rgba(52, 255, 179, 0.06);
        }

        :global(.diff-line.neutral) {
          opacity: 0.5;
        }

        :global(.diff-gutter) {
          font-weight: 700;
          width: 10px;
          flex-shrink: 0;
          user-select: none;
        }

        :global(.diff-line.removed .diff-gutter) {
          color: rgba(255, 82, 82, 0.8);
        }

        :global(.diff-line.added .diff-gutter) {
          color: rgba(52, 255, 179, 0.8);
        }

        :global(.diff-code) {
          color: rgba(255, 255, 255, 0.55);
        }

        :global(.diff-code .kw) {
          color: #7C8CFF;
        }

        :global(.diff-code .id-red) {
          color: rgba(255, 100, 100, 0.9);
        }

        :global(.diff-code .id-green) {
          color: rgba(52, 255, 179, 0.9);
        }

        :global(.diff-code.comment) {
          color: rgba(255, 255, 255, 0.25);
        }

        :global(.diff-code.muted) {
          color: rgba(255, 255, 255, 0.2);
        }

        /* ─── Terminal Visual ───────────────────────────── */
        :global(.terminal-visual) {
          width: 100%;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        :global(.term-header) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        :global(.term-dots) {
          display: flex;
          gap: 5px;
        }

        :global(.dot) {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
        }

        :global(.dot-red) { background: #FF5F57; }
        :global(.dot-yellow) { background: #FFBD2E; }
        :global(.dot-green) { background: #28C840; }

        :global(.term-title) {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.3);
          flex: 1;
          text-align: center;
          margin-right: 30px;
        }

        :global(.term-body) {
          padding: 18px 18px;
          background: #080909;
        }

        :global(.term-line) {
          display: flex;
          align-items: baseline;
          font-family: var(--font-mono);
          font-size: 12.5px;
          line-height: 2;
        }

        :global(.term-prompt) {
          color: #34FFB3;
          margin-right: 6px;
          font-weight: 600;
        }

        :global(.term-cmd) {
          color: rgba(255, 255, 255, 0.7);
        }

        :global(.term-check) {
          color: #34FFB3;
          margin-right: 6px;
        }

        :global(.term-key) {
          color: rgba(255, 255, 255, 0.4);
        }

        :global(.term-val) {
          color: rgba(255, 255, 255, 0.75);
        }

        /* ─── Responsive ────────────────────────────────── */
        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .built-for {
            padding: 96px 0;
          }

          .container {
            padding: 0 16px;
          }

          .header {
            margin-bottom: 56px;
          }

          .bento-grid {
            grid-template-columns: 1fr;
          }

          .card-visual {
            min-height: 160px;
          }
        }
      `}</style>
    </section>
  );
};
