'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const FeatureItem = ({ title, body }: { title: string; body: string }) => (
  <div className="feature-item">
    <div className="feature-icon-wrap">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7h10M7 2l5 5-5 5" stroke="#34FFB3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div>
      <h4 className="feature-title">{title}</h4>
      <p className="feature-body">{body}</p>
    </div>
    <style jsx>{`
      .feature-item {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }
      .feature-icon-wrap {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
      }
      .feature-title {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 6px;
      }
      .feature-body {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.6;
      }
    `}</style>
  </div>
);

export const CliFirst = () => {
  return (
    <section className="cli-first">
      <div className="container">
        <div className="cli-layout">

          {/* Left: text */}
          <motion.div
            className="cli-text"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="eyebrow-pill">
              <span className="eyebrow-label">Developer Experience</span>
            </div>

            <h2 className="cli-heading">
              Built for<br />
              the terminal.<br />
              Lives in<br />
              your workflow.
            </h2>

            <p className="cli-sub">
              We believe context belongs where the code is. Set up once, then forget it —
              every commit automatically keeps your agents in sync.
            </p>

            <div className="feature-list">
              <FeatureItem
                title="Zero Config Setup"
                body="contextly init scans your repo and generates a baseline in seconds."
              />
              <FeatureItem
                title="Commit-Level Capture"
                body="Every architectural decision logged automatically. No forms, no tickets."
              />
            </div>
          </motion.div>

          {/* Right: terminal — IDENTICAL chrome to Hero */}
          <motion.div
            className="cli-visual"
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.15, ease: EASE }}
          >
            {/* dim radial vignette behind terminal */}
            <div className="terminal-vignette" aria-hidden="true" />

            {/* Outer bezel — matches Hero exactly */}
            <div className="t-outer">
              {/* Inner terminal */}
              <div className="t-inner">
                {/* Header bar */}
                <div className="t-header">
                  <div className="t-dots">
                    <span className="t-dot dot-red" />
                    <span className="t-dot dot-yellow" />
                    <span className="t-dot dot-green" />
                  </div>
                  <span className="t-title">bash — contextly</span>
                </div>

                {/* Body */}
                <div className="t-body">
                  <div className="t-line">
                    <span className="t-prompt">$</span>
                    <span className="t-cmd"> contextly login</span>
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Authenticated via GitHub
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Project workspace initialized
                  </div>

                  <div className="t-spacer" />

                  <div className="t-line">
                    <span className="t-prompt">$</span>
                    <span className="t-cmd"> git commit -m </span>
                    <span className="t-str">&quot;refactor: move to supabase&quot;</span>
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Commit captured and parsed
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Decision stored:{' '}
                    <span className="t-hl">&quot;migrated to supabase — firebase pricing&quot;</span>
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Synced to{' '}
                    <span className="t-hl">3 active agent sessions</span>
                  </div>

                  <div className="t-spacer" />

                  <div className="t-line">
                    <span className="t-prompt">$</span>
                    <span className="t-cmd"> contextly sync</span>
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> Memory updated —{' '}
                    <span className="t-hl">143 decisions</span>
                  </div>
                  <div className="t-line t-out">
                    <span className="t-check">✓</span> All agents notified
                  </div>

                  <div className="t-cursor" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <style jsx>{`
        .cli-first {
          padding: 160px 0;
          background: #0D0E13;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
          overflow: hidden;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* ── Layout ── */
        .cli-layout {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 80px;
          align-items: center;
        }

        /* ── Left: text ── */
        .eyebrow-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(52, 255, 179, 0.07);
          border: 1px solid rgba(52, 255, 179, 0.18);
          margin-bottom: 28px;
        }

        .eyebrow-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #34FFB3;
        }

        .cli-heading {
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.0;
          background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 28px;
        }

        .cli-sub {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.65;
          margin-bottom: 48px;
          max-width: 420px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Right: terminal visual ── */
        .cli-visual {
          position: relative;
        }

        .terminal-vignette {
          position: absolute;
          inset: -80px;
          background: radial-gradient(ellipse at center, transparent 40%, #0D0E13 75%);
          pointer-events: none;
          z-index: 2;
        }

        /* Outer bezel — identical to Hero */
        .t-outer {
          position: relative;
          z-index: 3;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.05);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.10),
            0 60px 120px rgba(0, 0, 0, 0.6);
          padding: 6px;
        }

        /* Inner terminal */
        .t-inner {
          border-radius: calc(1rem - 6px);
          background: #0D0E13;
          overflow: hidden;
        }

        /* Header bar — identical to Hero */
        .t-header {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .t-dots {
          display: flex;
          gap: 7px;
        }

        .t-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red    { background: #FF5F57; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green  { background: #28C840; }

        .t-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.40);
        }

        /* Body — identical sizing to Hero */
        .t-body {
          padding: 28px;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.85);
        }

        .t-line {
          display: block;
          margin-bottom: 2px;
        }

        .t-out {
          color: rgba(255, 255, 255, 0.45);
          padding-left: 4px;
        }

        .t-prompt { color: #34FFB3; margin-right: 8px; }
        .t-cmd    { color: rgba(255,255,255,0.85); }
        .t-str    { color: rgba(124,140,255,0.9); }
        .t-check  { color: #34FFB3; margin-right: 6px; }
        .t-hl     { color: #7C8CFF; }

        .t-spacer { height: 10px; display: block; }

        .t-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: #34FFB3;
          vertical-align: middle;
          margin-top: 8px;
          animation: blink 1.1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        /* ── Mobile ── */
        @media (max-width: 1024px) {
          .cli-layout {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .cli-sub {
            max-width: 100%;
          }
          .terminal-vignette {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .cli-first {
            padding: 100px 0;
          }
          .container {
            padding: 0 20px;
          }
          .t-body {
            padding: 20px;
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  );
};
