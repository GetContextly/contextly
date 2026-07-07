'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export const Objection = () => {
  const comparisons = [
    {
      doc: "Goes stale within days",
      contextly: "Auto-captured from every commit"
    },
    {
      doc: "Has to be read in full",
      contextly: "Answers targeted questions directly"
    },
    {
      doc: "Locked to whoever wrote it",
      contextly: "Works across every AI agent automatically"
    }
  ];

  return (
    <section className="objection-section">
      <div className="container">
        <motion.div
          className="objection-card"
          initial={{ scale: 0.96, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="label">The obvious question</div>
          <div className="quote-wrapper">
            <span className="quote-mark">"</span>
            <p className="question">Can't I just ask my AI to write a summary doc?</p>
          </div>

          <p className="answer">
            Sure — now keep that doc perfectly in sync, forever, across every tool, without ever opening it yourself.
          </p>

          <div className="comparison-table">
            {comparisons.map((row, index) => (
              <motion.div
                key={index}
                className="comparison-row"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="side doc-side">
                  <X size={14} color="rgba(255, 100, 100, 0.6)" />
                  <span>{row.doc}</span>
                </div>
                <div className="side contextly-side">
                  <Check size={14} color="#34FFB3" />
                  <span>{row.contextly}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .objection-section {
          padding: 80px 0;
          background: #0A0B0F;
        }

        .objection-card {
          max-width: 700px;
          margin: 0 auto;
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 24px;
        }

        .quote-wrapper {
          position: relative;
          margin-bottom: 24px;
        }

        .quote-mark {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-240px);
          font-size: 80px;
          color: #34FFB3;
          opacity: 0.1;
          font-family: serif;
        }

        .question {
          font-size: 22px;
          font-weight: 500;
          color: white;
          font-style: italic;
        }

        .answer {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .comparison-table {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .side {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .doc-side {
          color: rgba(255, 255, 255, 0.55);
        }

        .contextly-side {
          color: white;
        }

        @media (max-width: 768px) {
          .objection-card {
            padding: 24px;
          }
          .quote-mark {
            display: none;
          }
          .comparison-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
};
