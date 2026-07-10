'use client';

import React from 'react';
import { motion } from 'framer-motion';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AGENTS = [
  'Claude Code',
  'Cursor',
  'GitHub Copilot',
  'Windsurf',
  'Zed',
  'Cody',
];

export const SupportedAgents = () => {
  return (
    <section className="agents-section">
      <div className="container">
        <motion.div
          className="header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="eyebrow">Compatible with every major AI coding agent</div>
          <h2 className="heading">One Source of Truth<br />for Every Agent.</h2>
        </motion.div>

        <motion.div
          className="strip-wrap"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
        >
          {/* Left fade */}
          <div className="fade fade-left" aria-hidden="true" />

          <div className="strip">
            {AGENTS.map((name) => (
              <span key={name} className="badge">
                {name}
              </span>
            ))}
          </div>

          {/* Right fade */}
          <div className="fade fade-right" aria-hidden="true" />
        </motion.div>
      </div>

      <style jsx>{`
        .agents-section {
          padding: 100px 0;
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .header {
          text-align: center;
          margin-bottom: 56px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 20px;
        }

        .heading {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.55) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        /* ── Strip ── */
        .strip-wrap {
          position: relative;
        }

        .strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 4px 40px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 9999px;
          padding: 8px 16px;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease;
        }

        .badge:hover {
          border-color: rgba(52, 255, 179, 0.25);
          color: rgba(255, 255, 255, 0.85);
          background: rgba(52, 255, 179, 0.05);
        }

        /* ── Fade gradients ── */
        .fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          pointer-events: none;
          z-index: 1;
        }

        .fade-left {
          left: 0;
          background: linear-gradient(to right, #0A0B0F, transparent);
        }

        .fade-right {
          right: 0;
          background: linear-gradient(to left, #0A0B0F, transparent);
        }

        @media (max-width: 768px) {
          .agents-section {
            padding: 72px 0;
          }

          .strip {
            gap: 8px;
            padding: 4px 24px;
          }

          .badge {
            font-size: 0.8125rem;
            padding: 7px 14px;
          }

          .fade {
            width: 40px;
          }
        }
      `}</style>
    </section>
  );
};
