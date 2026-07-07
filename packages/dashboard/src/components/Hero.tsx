'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Hero = () => {
  const bezier = [0.16, 1, 0.3, 1];

  return (
    <section className="hero-section">
      <div className="grid-pattern" />
      <div className="radial-glow" />

      <div className="hero-content">
        <motion.div
          className="eyebrow-tag"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: bezier }}
        >
          For developers running multiple AI agents
        </motion.div>

        <motion.h1
          className="headline"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: bezier }}
        >
          Stop re-explaining your project to every AI agent.
        </motion.h1>

        <motion.p
          className="subheadline"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: bezier }}
        >
          Contextly keeps a living, always-current brief of your project's architecture and decisions — so Claude Code, Cursor, or whatever's next can pick up exactly where you left off.
        </motion.p>

        <motion.div
          className="cta-form"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55, ease: bezier }}
        >
          <input type="email" placeholder="you@email.com" />
          <button>Join the waitlist</button>
        </motion.div>

        <motion.p
          className="micro-copy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          One email when we launch. No spam.
        </motion.p>

        <motion.div
          className="terminal-mockup"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: bezier }}
        >
          <div className="terminal-line"><span className="prompt">$</span> npx contextly init</div>
          <div className="terminal-line"><span className="success">✓</span> scanned 84 files, detected Next.js + Supabase</div>
          <div className="terminal-line"><span className="success">✓</span> mcp server connected — claude code, cursor</div>
        </motion.div>
      </div>

      <style jsx>{`
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 80px 24px;
        }

        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0;
        }

        .radial-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: #34FFB3;
          filter: blur(80px);
          opacity: 0.15;
          z-index: 0;
          border-radius: 50%;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 720px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .eyebrow-tag {
          background: rgba(52, 255, 179, 0.1);
          color: #34FFB3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 24px;
        }

        .headline {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          color: #FFFFFF;
        }

        .subheadline {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.65);
          max-width: 560px;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .cta-form {
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px;
          border-radius: 999px;
          display: flex;
          width: 100%;
          max-width: 480px;
          margin-bottom: 16px;
        }

        .cta-form input {
          background: transparent;
          border: none;
          padding: 12px 20px;
          color: white;
          flex: 1;
          font-size: 14px;
          outline: none;
        }

        .cta-form button {
          background: #34FFB3;
          color: black;
          padding: 10px 24px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .cta-form button:hover {
          transform: scale(1.03);
        }

        .micro-copy {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 64px;
        }

        .terminal-mockup {
          background: #0D0E13;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .terminal-line {
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.8);
        }

        .prompt {
          color: #34FFB3;
          margin-right: 8px;
        }

        .success {
          color: #34FFB3;
          margin-right: 8px;
        }

        @media (max-width: 768px) {
          .headline {
            font-size: clamp(2rem, 8vw, 2.5rem);
          }
          .cta-form {
            flex-direction: column;
            border-radius: 12px;
            background: transparent;
            border: none;
            padding: 0;
            gap: 12px;
          }
          .cta-form input {
            background: #12141C;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
          }
          .cta-form button {
            border-radius: 12px;
            padding: 14px;
          }
          .terminal-mockup {
            font-size: 11px;
          }
        }
      `}</style>
    </section>
  );
};
