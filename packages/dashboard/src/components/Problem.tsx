'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Problem = () => {
  const cards = [
    {
      title: "The Explainer's Loop",
      body: "Every time you open a new chat or switch from Claude to Cursor, you spend 5 minutes copying snippets and explaining 'No, we use Supabase, not Firebase.'",
      tag: "Time Sink"
    },
    {
      title: "Context Decay",
      body: "Your README says one thing, your current branch says another. AI agents hallucinate because they're reading stale documentation from 3 weeks ago.",
      tag: "Stale Data"
    },
    {
      title: "Fragmented Intent",
      body: "You decided on a specific architectural pattern yesterday. Today, your agent suggests a completely different approach because it doesn't know why you chose the first one.",
      tag: "Broken Sync"
    }
  ];

  return (
    <section className="problem-section">
      <div className="container">
        <div className="section-grid">
          <div className="text-content">
            <motion.div
              className="eyebrow"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              The Status Quo
            </motion.div>
            <motion.h2
              className="heading-m text-gradient"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Why AI coding feels <br />
              <span className="accent">like a chore.</span>
            </motion.h2>
          </div>

          <div className="cards-stack">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                className="problem-item"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="item-header">
                  <span className="item-tag">{card.tag}</span>
                  <h3>{card.title}</h3>
                </div>
                <p>{card.body}</p>
                <div className="bottom-border" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .problem-section {
          padding: 160px 0;
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
        }

        .section-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          align-items: start;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }

        .accent {
          color: rgba(255, 255, 255, 0.3);
        }

        .cards-stack {
          display: flex;
          flex-direction: column;
        }

        .problem-item {
          padding: 40px 0;
          position: relative;
        }

        .problem-item:first-child {
          padding-top: 0;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
        }

        .item-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #34FFB3;
          padding: 4px 10px;
          border: 1px solid rgba(52, 255, 179, 0.2);
          border-radius: 4px;
          text-transform: uppercase;
        }

        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
        }

        p {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          max-width: 500px;
        }

        .bottom-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
        }

        @media (max-width: 1024px) {
          .section-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
        }
      `}</style>
    </section>
  );
};
