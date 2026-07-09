'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const CliFirst = () => {
  return (
    <section className="cli-first">
      <div className="container">
        <div className="cli-layout">
          <motion.div
            className="cli-text"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="eyebrow">Developer Experience</div>
            <h2 className="heading-m text-gradient">The CLI-first <br />source of truth.</h2>
            <p>We believe context belongs where the code is. Our CLI is designed to be the primary interface, while the dashboard handles the high-level oversight.</p>

            <div className="feature-list">
              <div className="feature">
                <span className="bullet">⚡</span>
                <div>
                  <h4>Zero Config Init</h4>
                  <p>Scan your repo and generate a baseline context in seconds.</p>
                </div>
              </div>
              <div className="feature">
                <span className="bullet">✦</span>
                <div>
                  <h4>Contextual Logging</h4>
                  <p>Log decisions directly from your terminal as you make them.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="cli-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="terminal-preview">
              <div className="t-head">
                <span className="t-user">guest@contextly</span>
                <span className="t-path">~/project</span>
              </div>
              <div className="t-body">
                <div className="t-in">contextly log "Switched to Tailwind v4"</div>
                <div className="t-out">
                  <span className="t-s">✓</span> Decision captured.<br />
                  <span className="t-s">✓</span> Synced to 3 active agent sessions.<br />
                  <span className="t-s">✓</span> Broadcasted to team.
                </div>
                <div className="t-in">contextly status</div>
                <div className="t-out">
                  Project: <span className="t-h">Contextly Dashboard</span><br />
                  Health: <span className="t-s">Optimal</span><br />
                  Last Sync: <span className="t-h">2 minutes ago</span>
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
        }

        .cli-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 100px;
          align-items: center;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }

        .cli-text p {
          font-size: 1.15rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .feature {
          display: flex;
          gap: 20px;
        }

        .bullet {
          font-size: 20px;
          color: #34FFB3;
        }

        .feature h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }

        .feature p {
          font-size: 0.95rem;
          margin-bottom: 0;
        }

        .cli-visual {
          position: relative;
        }

        .terminal-preview {
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 40px 80px rgba(0,0,0,0.4);
          overflow: hidden;
        }

        .t-head {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 20px;
          display: flex;
          gap: 20px;
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .t-user { color: #34FFB3; }
        .t-path { color: rgba(255, 255, 255, 0.3); }

        .t-body {
          padding: 30px;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.8;
          color: white;
        }

        .t-in {
          position: relative;
          padding-left: 20px;
          margin-bottom: 12px;
        }

        .t-in::before {
          content: ">";
          position: absolute;
          left: 0;
          color: #34FFB3;
        }

        .t-out {
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }

        .t-s { color: #34FFB3; }
        .t-h { color: #7C8CFF; }

        @media (max-width: 1024px) {
          .cli-layout {
            grid-template-columns: 1fr;
            gap: 60px;
          }
        }
      `}</style>
    </section>
  );
};
