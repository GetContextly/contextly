'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Objection = () => {
  return (
    <section className="objection-section">
      <div className="container">
        <motion.div
          className="objection-inner"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="content">
            <span className="label">The Hard Truth</span>
            <h2 className="heading-m">"Can't I just prompt <br />my AI for a summary?"</h2>
            <p>Sure — but will that summary be perfectly in sync next Tuesday after you've merged 4 PRs and refactored the auth layer? <br /><br />Manual documentation is a lie we tell ourselves during onboarding. Contextly is the truth that stays updated by itself.</p>
          </div>

          <div className="stats-box">
            <div className="stat">
              <span className="num">0.0s</span>
              <span className="desc">Manual Maintenance</span>
            </div>
            <div className="stat">
              <span className="num">100%</span>
              <span className="desc">Sync Accuracy</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .objection-section {
          padding: 100px 0;
          background: #0A0B0F;
        }

        .objection-inner {
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
          padding: 80px;
          display: flex;
          align-items: center;
          gap: 100px;
        }

        .content {
          flex: 1.5;
        }

        .label {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          color: #34FFB3;
          margin-bottom: 24px;
          display: block;
        }

        h2 {
          margin-bottom: 32px;
        }

        p {
          font-size: 1.25rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
        }

        .stats-box {
          flex: 1;
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 20px;
        }

        .stat {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .num {
          font-family: var(--font-mono);
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        @media (max-width: 1024px) {
          .objection-inner {
            flex-direction: column;
            padding: 40px;
            gap: 60px;
            text-align: center;
          }
          .stats-box {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};
