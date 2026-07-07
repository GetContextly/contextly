'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Run one command",
      body: "npx contextly init scans your repo and sets up everything automatically."
    },
    {
      number: "02",
      title: "It watches quietly",
      body: "Git commits and merged PRs get captured in the background — no manual docs to maintain."
    },
    {
      number: "03",
      title: "Any agent connects",
      body: "Claude Code, Cursor, or whatever you use next reads from the same live brief via MCP."
    },
    {
      number: "04",
      title: "Switch freely",
      body: "Change tools, change machines, come back after a week — the context is exactly where you left it."
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">How it works</div>
          <h2>One command. Every agent stays current.</h2>
        </div>

        <div className="steps-container">
          <div className="connecting-line" />
          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="step-item"
                initial={{ y: 24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="agent-query-card"
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="code-line">
            <span className="prompt">agent{'>'}</span> <span className="method">get_context</span>("<span className="string">authentication</span>")
          </div>
          <div className="code-line response">
            <span className="prompt">contextly{'>'}</span> Using Supabase Auth with GitHub OAuth.
          </div>
          <div className="code-line response indent">
            Switched from custom JWT on Mar 3 —
          </div>
          <div className="code-line response indent">
            see decision #14 for reasoning.
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .how-it-works {
          padding: 120px 0;
          background: #0A0B0F;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
        }

        h2 {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 600;
          color: white;
          margin-top: 12px;
        }

        .steps-container {
          position: relative;
          margin-bottom: 80px;
        }

        .connecting-line {
          position: absolute;
          top: 24px;
          left: 0;
          right: 0;
          height: 1px;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px);
          z-index: 0;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          position: relative;
          z-index: 1;
        }

        .step-item {
          display: flex;
          flex-direction: column;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid #34FFB3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #34FFB3;
          font-size: 14px;
          font-weight: 600;
          background: #0A0B0F;
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

        .agent-query-card {
          background: #0D0E13;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 32px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .code-line {
          margin-bottom: 8px;
          color: white;
        }

        .prompt {
          color: #34FFB3;
        }

        .method {
          color: #7C8CFF;
        }

        .string {
          color: #34FFB3;
          opacity: 0.8;
        }

        .response {
          color: rgba(255, 255, 255, 0.8);
        }

        .indent {
          padding-left: 88px;
        }

        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .connecting-line {
            display: none;
          }
          .indent {
            padding-left: 0;
          }
          .how-it-works {
            padding: 80px 0;
          }
        }
      `}</style>
    </section>
  );
};
