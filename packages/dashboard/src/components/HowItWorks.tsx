'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const HowItWorks = () => {
  const steps = [
    {
      title: "Automated Context Capture",
      body: "Contextly integrates with your Git workflow. Every commit message, PR description, and architectural change is analyzed and stored.",
      icon: "⚡"
    },
    {
      title: "Knowledge Graph Generation",
      body: "We build a real-time map of your project's decisions. It's not just a file tree; it's the reasoning behind the code.",
      icon: "◈"
    },
    {
      title: "Seamless Agent Sync",
      body: "Our MCP server acts as the gateway. Any AI agent you use can query Contextly for the ground truth instantly.",
      icon: "✦"
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="eyebrow">The Architecture</div>
          <h2 className="heading-m text-gradient">Built for speed, <br />designed for depth.</h2>
        </motion.div>

        <div className="steps-visual">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>

              {index < steps.length - 1 && (
                <div className="connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="tech-details">
          <div className="detail-item">
            <span className="label">Protocol</span>
            <span className="value">MCP / JSON-RPC</span>
          </div>
          <div className="detail-item">
            <span className="label">Latency</span>
            <span className="value">{'<'} 50ms</span>
          </div>
          <div className="detail-item">
            <span className="label">Privacy</span>
            <span className="value">Encrypted at Rest</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .how-it-works {
          padding: 160px 0;
          background: #0D0E13;
          position: relative;
        }

        .section-header {
          text-align: center;
          margin-bottom: 100px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }

        .steps-visual {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          margin-bottom: 100px;
        }

        .step-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 40px;
          border-radius: 24px;
          transition: transform 0.3s, border-color 0.3s;
        }

        .step-card:hover {
          transform: translateY(-5px);
          border-color: rgba(52, 255, 179, 0.2);
        }

        .step-icon {
          width: 50px;
          height: 50px;
          background: rgba(52, 255, 179, 0.1);
          color: #34FFB3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-bottom: 16px;
        }

        p {
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.4);
        }

        .connector {
          position: absolute;
          top: 50%;
          right: -32px;
          transform: translateY(-50%);
          z-index: 2;
        }

        .tech-details {
          display: flex;
          justify-content: center;
          gap: 60px;
          padding: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.1em;
        }

        .value {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
        }

        @media (max-width: 1024px) {
          .steps-visual {
            grid-template-columns: 1fr;
          }
          .connector {
            display: none;
          }
          .tech-details {
            flex-direction: column;
            gap: 30px;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
};
