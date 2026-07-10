'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

// Terminal lines — each rendered as its own staggered element
type TerminalLineData = {
  type: 'cmd' | 'blank' | 'info' | 'success' | 'label' | 'agent' | 'prompt-end';
  content?: string;
  highlights?: string[];
  status?: string;
};

type TerminalLine = TerminalLineData;

const TERMINAL_LINES: TerminalLineData[] = [
  { type: 'cmd',        content: '$ contextly init' },
  { type: 'blank' },
  { type: 'info',       content: '  Scanning repository...' },
  { type: 'success',    content: '  Detected Next.js · Supabase · TypeScript', highlights: ['Next.js', 'Supabase', 'TypeScript'] },
  { type: 'success',    content: '  (142 files)' },
  { type: 'success',    content: '  Parsed 38 commits, 6 pull requests', highlights: ['38 commits', '6 pull requests'] },
  { type: 'blank' },
  { type: 'info',       content: '  Linking to Contextly cloud...' },
  { type: 'success',    content: '  Project registered  proj_8f2a1c9e', highlights: ['proj_8f2a1c9e'] },
  { type: 'success',    content: '  MCP server configured' },
  { type: 'blank' },
  { type: 'label',      content: '  Your agents are ready.' },
  { type: 'blank' },
  { type: 'info',       content: '  Compatible with:' },
  { type: 'agent',      content: '    Claude Code',      status: 'connected' },
  { type: 'agent',      content: '    Cursor',           status: 'connected' },
  { type: 'agent',      content: '    GitHub Copilot',   status: 'connected' },
  { type: 'agent',      content: '    Windsurf',         status: 'connected' },
  { type: 'blank' },
  { type: 'prompt-end' },
];

function TerminalLineView({ line }: { line: TerminalLine }) {
  if (line.type === 'blank') return <div style={{ height: '0.65em' }} aria-hidden="true" />;

  if (line.type === 'cmd') {
    return (
      <div className="t-row">
        <span className="t-cmd-text">{line.content}</span>
      </div>
    );
  }

  if (line.type === 'prompt-end') {
    return (
      <div className="t-row" aria-label="cursor">
        <span className="t-prompt-sym">$</span>
        <span className="t-cursor" aria-hidden="true" />
      </div>
    );
  }

  if (line.type === 'success') {
    let text = line.content ?? '';
    if (!line.highlights?.length) {
      return (
        <div className="t-row">
          <span className="t-check" aria-hidden="true">&#10003;</span>
          <span className="t-out">{text.trimStart()}</span>
        </div>
      );
    }

    // Render with highlights
    const parts: React.ReactNode[] = [];
    let remaining = text.trimStart();
    let key = 0;
    for (const hl of line.highlights ?? []) {
      const idx = remaining.indexOf(hl);
      if (idx === -1) continue;
      if (idx > 0) parts.push(<span key={key++} className="t-out">{remaining.slice(0, idx)}</span>);
      parts.push(<span key={key++} className="t-hl">{hl}</span>);
      remaining = remaining.slice(idx + hl.length);
    }
    if (remaining) parts.push(<span key={key++} className="t-out">{remaining}</span>);

    return (
      <div className="t-row">
        <span className="t-check" aria-hidden="true">&#10003;</span>
        {parts}
      </div>
    );
  }

  if (line.type === 'info') {
    return (
      <div className="t-row">
        <span className="t-info">{(line.content ?? '').trimStart()}</span>
      </div>
    );
  }

  if (line.type === 'label') {
    return (
      <div className="t-row">
        <span className="t-label">{(line.content ?? '').trimStart()}</span>
      </div>
    );
  }

  if (line.type === 'agent') {
    const name = (line.content ?? '').trimStart();
    return (
      <div className="t-row t-agent-row">
        <span className="t-diamond" aria-hidden="true">&#9670;</span>
        <span className="t-agent-name">{name}</span>
        <span className="t-agent-status" aria-label="connected">&#10003; connected</span>
      </div>
    );
  }

  return null;
}

export const Hero = () => {
  const prefersReduced = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: prefersReduced ? undefined : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  const terminalEntrance = {
    initial: prefersReduced ? undefined : { opacity: 0, y: 40, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 1.2, delay: 0.45, ease: EASE },
  };

  // Line stagger: starts at 0.9s, 0.1s per line
  const lineVariants = {
    hidden: { opacity: 0, x: -4 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        delay: 0.9 + i * 0.1,
        ease: EASE,
      },
    }),
  };

  const scrollToWaitlist = () => {
    const el = document.getElementById('waitlist');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-wrap" aria-label="Hero">
      {/* Background: grid lines with radial fade */}
      <div className="bg-grid" aria-hidden="true" />

      {/* Terminal glow — positioned absolutely, painted last */}
      <div className="terminal-glow" aria-hidden="true" />

      <div className="hero-content">
        {/* 1. Eyebrow */}
        <motion.p className="eyebrow" aria-label="Version info" {...fadeUp(0)}>
          contextly v0.1 &middot; early access
        </motion.p>

        {/* 2. H1 — two lines, treated as a poster */}
        <motion.h1 className="headline" {...fadeUp(0.1)}>
          <span className="headline-white">Stop re-explaining</span>
          <br />
          <span className="headline-green">your project.</span>
        </motion.h1>

        {/* 3. Subtext */}
        <motion.p className="subtext" {...fadeUp(0.25)}>
          One CLI command gives Claude Code, Cursor, and Copilot a living project
          brief - auto-updated from git.
        </motion.p>

        {/* 4. CTA */}
        <motion.div className="cta-wrap" {...fadeUp(0.35)}>
          <button
            type="button"
            className="cta-btn"
            onClick={scrollToWaitlist}
            aria-label="Join the waitlist"
          >
            <span className="cta-label">Join the waitlist</span>
            <span className="cta-arrow-circle" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <p className="social-proof">2,400+ developers waiting</p>
        </motion.div>

        {/* 5. Terminal — THE STAR */}
        <motion.div className="terminal-region" {...terminalEntrance} aria-label="Terminal preview">
          {/* Outer bezel */}
          <div className="terminal-outer">
            {/* Inner panel */}
            <div className="terminal-inner">
              {/* Header bar */}
              <div className="t-header" aria-hidden="true">
                <div className="t-dots">
                  <span className="t-dot t-dot-red" />
                  <span className="t-dot t-dot-yellow" />
                  <span className="t-dot t-dot-green" />
                </div>
                <span className="t-title">bash &mdash; contextly</span>
              </div>

              {/* Terminal body */}
              <div className="t-body" role="log" aria-label="Terminal output">
                {(TERMINAL_LINES as TerminalLine[]).map((line, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    initial={prefersReduced ? undefined : 'hidden'}
                    animate="visible"
                    variants={prefersReduced ? undefined : lineVariants}
                  >
                    <TerminalLineView line={line} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow beneath terminal */}
          <div className="terminal-underline" aria-hidden="true" />
          <div className="terminal-underglow" aria-hidden="true" />

          {/* 6. Agent row */}
          <div className="agent-row" aria-label="Compatible agents">
            <span className="agent-row-label">Works with</span>
            {['Claude Code', 'Cursor', 'GitHub Copilot', 'Windsurf'].map((tool) => (
              <span key={tool} className="agent-badge">{tool}</span>
            ))}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        /* ── Wrapper ───────────────────────────────────────────── */
        .hero-wrap {
          position: relative;
          min-height: 100dvh;
          padding: 160px 24px 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          background: #0A0B0F;
        }

        /* ── Grid background ────────────────────────────────────── */
        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          /* Fade grid toward all edges */
          -webkit-mask-image: radial-gradient(
            ellipse 80% 80% at 50% 50%,
            black 30%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 80% 80% at 50% 50%,
            black 30%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* ── Signal-green glow — behind/below terminal ONLY ────── */
        .terminal-glow {
          position: absolute;
          /* visually below where the terminal sits */
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 300px;
          background: radial-gradient(
            ellipse 60% 100% at 50% 100%,
            rgba(52, 255, 179, 0.06) 0%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Content column ─────────────────────────────────────── */
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* ── Eyebrow ────────────────────────────────────────────── */
        .eyebrow {
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.3);
          margin: 0 0 32px;
          line-height: 1;
        }

        /* ── H1 ─────────────────────────────────────────────────── */
        .headline {
          font-family: var(--font-inter, sans-serif);
          font-size: clamp(3.5rem, 8vw, 6rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.05em;
          margin: 0 0 28px;
        }

        .headline-white {
          display: block;
          color: #ffffff;
        }

        .headline-green {
          display: block;
          color: #34FFB3;
        }

        /* ── Subtext ────────────────────────────────────────────── */
        .subtext {
          font-family: var(--font-inter, sans-serif);
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          max-width: 520px;
          margin: 0 0 44px;
        }

        /* ── CTA button ─────────────────────────────────────────── */
        .cta-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin-bottom: 72px;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #34FFB3;
          color: #060709;
          border: none;
          border-radius: 9999px;
          padding: 14px 14px 14px 24px;
          cursor: pointer;
          font-family: var(--font-inter, sans-serif);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          white-space: nowrap;
          transition:
            background 0.3s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 0 0 rgba(52, 255, 179, 0);
        }

        .cta-btn:hover {
          background: #2ae8a1;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(52, 255, 179, 0.2);
        }

        .cta-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: none;
        }

        .cta-label {
          line-height: 1;
        }

        .cta-arrow-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.12);
          flex-shrink: 0;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cta-btn:hover .cta-arrow-circle {
          transform: translateX(2px);
        }

        .social-proof {
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.28);
          letter-spacing: 0.02em;
          margin: 0;
          line-height: 1;
        }

        /* ── Terminal region ───────────────────────────────────── */
        .terminal-region {
          position: relative;
          width: 100%;
          max-width: 900px;
        }

        /* ── Outer bezel ──────────────────────────────────────── */
        .terminal-outer {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 60px 120px rgba(0, 0, 0, 0.65),
            0 20px 48px rgba(0, 0, 0, 0.4);
        }

        /* ── Inner panel ──────────────────────────────────────── */
        .terminal-inner {
          background: #0D0E13;
          border-radius: calc(1rem - 6px);
          overflow: hidden;
        }

        /* ── Header bar ───────────────────────────────────────── */
        .t-header {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 48px;
        }

        .t-dots {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-shrink: 0;
        }

        .t-dot {
          display: block;
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }

        .t-dot-red    { background: #FF5F57; }
        .t-dot-yellow { background: #FFBD2E; }
        .t-dot-green  { background: #28C840; }

        .t-title {
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          flex: 1;
        }

        /* ── Terminal body ────────────────────────────────────── */
        .t-body {
          padding: 28px 36px 36px;
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 13px;
          line-height: 1.95;
          text-align: left;
        }

        /* ── Terminal line atoms ──────────────────────────────── */

        /* All rows share flex layout */
        :global(.t-row) {
          display: flex;
          align-items: baseline;
          gap: 0;
          min-height: 1.95em;
        }

        /* Command line */
        :global(.t-cmd-text) {
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 0.01em;
        }

        /* Prompt symbol at end */
        :global(.t-prompt-sym) {
          color: #34FFB3;
          font-weight: 600;
          margin-right: 8px;
        }

        /* Blinking cursor block */
        :global(.t-cursor) {
          display: inline-block;
          width: 8px;
          height: 15px;
          background: #34FFB3;
          border-radius: 1px;
          vertical-align: middle;
          animation: blink 1.1s step-start infinite;
        }

        @keyframes blink {
          0%, 49%  { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.t-cursor) { animation: none; opacity: 1; }
        }

        /* Check mark */
        :global(.t-check) {
          color: #34FFB3;
          font-weight: 600;
          margin-right: 10px;
          flex-shrink: 0;
        }

        /* Default output text */
        :global(.t-out) {
          color: rgba(255, 255, 255, 0.58);
        }

        /* Highlighted values */
        :global(.t-hl) {
          color: rgba(255, 255, 255, 0.85);
        }

        /* Dim info text */
        :global(.t-info) {
          color: rgba(255, 255, 255, 0.35);
        }

        /* "Your agents are ready." label */
        :global(.t-label) {
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
        }

        /* Agent rows */
        :global(.t-agent-row) {
          gap: 0;
        }

        :global(.t-diamond) {
          color: rgba(255, 255, 255, 0.3);
          font-size: 9px;
          margin-right: 10px;
          flex-shrink: 0;
          position: relative;
          top: -1px;
        }

        :global(.t-agent-name) {
          color: rgba(255, 255, 255, 0.65);
          min-width: 180px;
        }

        :global(.t-agent-status) {
          color: #34FFB3;
          font-size: 12px;
          opacity: 0.85;
        }

        /* ── Glow lines beneath terminal ──────────────────────── */
        .terminal-underline {
          position: absolute;
          bottom: 62px; /* sits just below compat row */
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(52, 255, 179, 0.4) 50%,
            transparent 100%
          );
          pointer-events: none;
        }

        .terminal-underglow {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 100px;
          background: radial-gradient(
            ellipse at 50% 100%,
            rgba(52, 255, 179, 0.06) 0%,
            transparent 80%
          );
          filter: blur(30px);
          pointer-events: none;
        }

        /* ── Agent badges row ─────────────────────────────────── */
        .agent-row {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
        }

        .agent-row-label {
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.28);
          letter-spacing: 0.06em;
          margin-right: 4px;
        }

        .agent-badge {
          font-family: var(--font-jetbrains-mono, monospace);
          font-size: 10px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          padding: 4px 12px;
          letter-spacing: 0.01em;
          line-height: 1;
          white-space: nowrap;
          transition:
            color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agent-badge:hover {
          color: rgba(255, 255, 255, 0.75);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* ── Mobile ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .hero-wrap {
            padding: 130px 16px 100px;
          }

          .headline {
            font-size: clamp(2.8rem, 10vw, 4.5rem);
          }

          .subtext {
            font-size: 1rem;
          }

          .cta-btn {
            font-size: 15px;
            padding: 13px 13px 13px 22px;
          }

          .t-body {
            padding: 20px 20px 28px;
            font-size: 11.5px;
          }

          :global(.t-agent-name) {
            min-width: 120px;
          }

          .terminal-outer {
            border-radius: 14px;
            padding: 5px;
          }

          .terminal-inner {
            border-radius: calc(14px - 5px);
          }

          .t-header {
            padding: 12px 16px;
          }

          .agent-row {
            gap: 6px;
          }

          .terminal-underline,
          .terminal-underglow {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .hero-wrap {
            padding: 110px 12px 80px;
          }

          .t-body {
            padding: 16px 16px 22px;
            font-size: 10.5px;
          }

          :global(.t-agent-name) {
            min-width: 100px;
          }

          :global(.t-agent-status) {
            font-size: 10.5px;
          }
        }
      `}</style>
    </section>
  );
};
