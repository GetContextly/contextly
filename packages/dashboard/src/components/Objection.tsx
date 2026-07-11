'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Objection = () => {
  return (
    <section className="objection-section">
      <div className="container">
        <motion.div
          className="outer-shell"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inner-core">
            <div className="split-grid">

              {/* Left column — the objection */}
              <div className="col-left">
                <span className="eyebrow">The Hard Truth</span>
                <blockquote className="big-quote">
                  &quot;Can&apos;t I just<br />prompt my AI?&quot;
                </blockquote>
              </div>

              {/* Right column — the answer */}
              <div className="col-right">
                <p className="answer-text">
                  Manual documentation is a lie we tell ourselves during onboarding.
                  After 4 merged PRs and a refactored auth layer, your hand-crafted
                  summary is already wrong. Contextly is the truth that stays
                  current — automatically.
                </p>

                <div className="stats-stack">
                  <div className="stat-box">
                    <span className="stat-num">0.0s</span>
                    <span className="stat-desc">Manual maintenance required</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">Always</span>
                    <span className="stat-desc">Context is current</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .objection-section {
          padding: 96px 0;
          background: #0A0B0F;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Double-bezel outer shell */
        .outer-shell {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 2.5rem;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          padding: 0.5rem;
        }

        /* Inner core */
        .inner-core {
          border-radius: calc(2.5rem - 0.5rem);
          background: #12141C;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
          overflow: hidden;
        }

        /* 60/40 split grid */
        .split-grid {
          display: grid;
          grid-template-columns: 60fr 40fr;
        }

        /* Left column */
        .col-left {
          background: #0D0E13;
          padding: 64px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Right column */
        .col-right {
          background: #12141C;
          padding: 64px;
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 40px;
        }

        /* Eyebrow pill badge */
        .eyebrow {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 500;
          color: #34FFB3;
          background: rgba(52, 255, 179, 0.08);
          border: 1px solid rgba(52, 255, 179, 0.2);
          border-radius: 9999px;
          padding: 4px 12px;
          margin-bottom: 36px;
          width: fit-content;
        }

        /* Large quote */
        .big-quote {
          margin: 0;
          font-family: var(--font-inter);
          font-size: 2.8rem;
          font-weight: 700;
          line-height: 1.15;
          background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.55) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        /* Answer paragraph */
        .answer-text {
          font-family: var(--font-inter);
          font-size: 1rem;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
        }

        /* Stats stack */
        .stats-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Individual stat box — simplified double-bezel */
        .stat-box {
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-num {
          font-family: var(--font-mono);
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .stat-desc {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.3);
        }

        /* Mobile: single column, remove border-left */
        @media (max-width: 768px) {
          .objection-section {
            padding: 96px 0;
          }

          .container {
            padding: 0 16px;
          }

          .split-grid {
            grid-template-columns: 1fr;
          }

          .col-left {
            padding: 40px 28px;
          }

          .col-right {
            padding: 40px 28px;
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            gap: 32px;
          }

          .big-quote {
            font-size: 2rem;
          }
        }
      `}</style>
    </section>
  );
};
