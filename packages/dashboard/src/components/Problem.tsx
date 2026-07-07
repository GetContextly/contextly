'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, FileX, Users } from 'lucide-react';

export const Problem = () => {
  const cards = [
    {
      icon: <RotateCcw size={24} color="#34FFB3" />,
      title: "Hit a limit, lose the thread",
      body: "You hit a usage cap mid-task, switch tools, and have to re-explain your entire architecture from scratch."
    },
    {
      icon: <FileX size={24} color="#7C8CFF" />,
      title: "Docs go stale in days",
      body: "A README you write once is out of date by the next sprint — nobody keeps it maintained."
    },
    {
      icon: <Users size={24} color="#34FFB3" />,
      title: "Every tool sees something different",
      body: "Your team uses Claude Code, Cursor, Copilot — each with its own picture of the codebase, so output stays inconsistent."
    }
  ];

  return (
    <section className="problem-section">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">The problem</div>
          <h2>Every new AI session starts from zero.</h2>
        </div>

        <div className="problem-grid">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="problem-card"
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="icon-wrapper">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .problem-section {
          padding: 120px 0;
          background: #0A0B0F;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        h2 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 600;
          color: white;
        }

        .problem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .problem-card {
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .icon-wrapper {
          margin-bottom: 24px;
        }

        h3 {
          font-size: 17px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }

        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .problem-grid {
            grid-template-columns: 1fr;
          }
          .problem-section {
            padding: 80px 0;
          }
        }
      `}</style>
    </section>
  );
};
