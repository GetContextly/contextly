'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const CliFirst = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = [
    '$ npx contextly init',
    '$ contextly login',
    '$ git commit -m "switch auth --context"',
    '$ contextly sync'
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (currentLine < fullText.length) {
        if (currentChar < fullText[currentLine].length) {
          setDisplayText(prev => prev + fullText[currentLine][currentChar]);
          currentChar++;
          timeout = setTimeout(type, 30);
        } else {
          setDisplayText(prev => prev + '\n');
          currentLine++;
          currentChar = 0;
          timeout = setTimeout(type, 500);
        }
      }
    };

    timeout = setTimeout(type, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="cli-first">
      <div className="container">
        <div className="cli-grid">
          <motion.div
            className="terminal-column"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="dot red" />
                <div className="dot yellow" />
                <div className="dot green" />
              </div>
              <div className="terminal-body">
                <pre>{displayText}</pre>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="text-column"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="eyebrow">Built for the terminal</div>
            <h2>Everything that matters happens without opening a browser.</h2>
            <p className="description">
              Setup, syncing, logging decisions, connecting agents — all CLI. The dashboard exists for the few things a terminal genuinely does worse: managing team access, billing, and exporting context.
            </p>

            <ul className="benefit-list">
              <li><Check size={16} color="#34FFB3" /> <span>One command to set up</span></li>
              <li><Check size={16} color="#34FFB3" /> <span>No dashboard required for daily use</span></li>
              <li><Check size={16} color="#34FFB3" /> <span>Works exactly where you already are</span></li>
            </ul>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .cli-first {
          padding: 120px 0;
          background: #0A0B0F;
        }

        .cli-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .terminal-window {
          background: #0D0E13;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
        }

        .terminal-header {
          background: rgba(255, 255, 255, 0.03);
          padding: 12px 16px;
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          opacity: 0.3;
        }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }

        .terminal-body {
          padding: 24px;
          min-height: 200px;
        }

        pre {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: white;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        h2 {
          font-size: clamp(1.5rem, 3.5vw, 2rem);
          font-weight: 600;
          color: white;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .description {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .benefit-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .benefit-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: white;
        }

        @media (max-width: 768px) {
          .cli-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .text-column {
            order: -1;
          }
          pre {
            font-size: 11px;
          }
        }
      `}</style>
    </section>
  );
};
