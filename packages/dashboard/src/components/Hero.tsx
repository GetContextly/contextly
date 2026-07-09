'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Hero = () => {
  const bezier = [0.19, 1, 0.22, 1];

  return (
    <section className="hero-section">
      <div className="grid-pattern" />
      <div className="beam-container">
        <div className="beam beam-1" />
        <div className="beam beam-2" />
      </div>

      <div className="hero-content">
        <motion.div
          className="badge-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: bezier }}
        >
          <span className="badge-glow" />
          <div className="badge-content">
            <span className="dot" />
            V1.0 Early Access
          </div>
        </motion.div>

        <motion.h1
          className="heading-l text-gradient"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: bezier }}
        >
          Context syncing <br />
          <span className="highlight">for the AI era.</span>
        </motion.h1>

        <motion.p
          className="subheadline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: bezier }}
        >
          Contextly is the living memory for your AI agents. It captures every architectural decision, every "why", and every breaking change — so your agents never lose the plot.
        </motion.p>

        <motion.div
          className="cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: bezier }}
        >
          <div className="input-wrapper">
            <input type="email" placeholder="Enter your email" />
            <button className="primary-btn">
              Get Priority Access
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </motion.div>

        <motion.div
          className="visual-container"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: bezier }}
        >
          <div className="glass-card terminal">
            <div className="terminal-header">
              <div className="controls">
                <div className="c-dot" />
                <div className="c-dot" />
                <div className="c-dot" />
              </div>
              <div className="terminal-title">bash — contextly init</div>
            </div>
            <div className="terminal-content">
              <div className="t-line"><span className="p-t">$</span> contextly init</div>
              <div className="t-line"><span className="p-s">✓</span> Detected <span className="p-h">T3 Stack</span> (Next.js, Supabase, Tailwind)</div>
              <div className="t-line"><span className="p-s">✓</span> Indexed 142 files in 0.8s</div>
              <div className="t-line"><span className="p-s">✓</span> MCP Server Live — Agents connected</div>
              <div className="t-line cursor" />
            </div>
          </div>

          <div className="floating-elements">
            <motion.div
              className="float-card c1"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="icon">◈</div>
              <div className="info">
                <span>Claude</span>
                <div className="status">Synced</div>
              </div>
            </motion.div>
            <motion.div
              className="float-card c2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="icon">✦</div>
              <div className="info">
                <span>Cursor</span>
                <div className="status">Active</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .hero-section {
          position: relative;
          min-height: 100vh;
          padding: 160px 0 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          background: #0A0B0F;
        }

        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
        }

        .beam-container {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .beam {
          position: absolute;
          width: 1px;
          height: 400px;
          background: linear-gradient(to bottom, transparent, #34FFB3, transparent);
          opacity: 0.2;
        }

        .beam-1 { left: 30%; animation: beam-float 8s infinite linear; }
        .beam-2 { left: 70%; animation: beam-float 12s infinite linear reverse; }

        @keyframes beam-float {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 24px;
        }

        .badge-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 32px;
          backdrop-filter: blur(8px);
        }

        .badge-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.8);
        }

        .badge-content .dot {
          width: 6px;
          height: 6px;
          background: #34FFB3;
          border-radius: 50%;
          box-shadow: 0 0 10px #34FFB3;
        }

        .highlight {
          color: #34FFB3;
          position: relative;
        }

        .subheadline {
          font-size: clamp(1.1rem, 2vw, 1.25rem);
          color: rgba(255, 255, 255, 0.5);
          max-width: 600px;
          line-height: 1.6;
          margin: 32px 0 48px;
        }

        .cta-group {
          width: 100%;
          max-width: 500px;
          margin-bottom: 80px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          padding: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          backdrop-filter: blur(12px);
          transition: border-color 0.3s;
        }

        .input-wrapper:focus-within {
          border-color: #34FFB3;
        }

        .input-wrapper input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0 24px;
          color: white;
          font-size: 15px;
          outline: none;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #34FFB3;
          color: #000;
          padding: 12px 24px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 15px;
          transition: transform 0.2s, background 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          background: #2ee6a1;
        }

        .visual-container {
          position: relative;
          width: 100%;
          max-width: 800px;
        }

        .glass-card {
          background: rgba(13, 14, 19, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        .terminal {
          text-align: left;
        }

        .terminal-header {
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .controls {
          display: flex;
          gap: 8px;
        }

        .c-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .terminal-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .terminal-content {
          padding: 30px;
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.8;
        }

        .t-line { margin-bottom: 4px; }
        .p-t { color: #34FFB3; margin-right: 12px; }
        .p-s { color: #34FFB3; margin-right: 12px; }
        .p-h { color: #7C8CFF; }

        .cursor {
          display: inline-block;
          width: 8px;
          height: 18px;
          background: #34FFB3;
          vertical-align: middle;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .float-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .float-card .icon {
          font-size: 20px;
          color: #34FFB3;
        }

        .float-card span {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .float-card .status {
          font-size: 10px;
          color: #34FFB3;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .c1 { top: -20px; left: -40px; }
        .c2 { bottom: 40px; right: -30px; }

        @media (max-width: 768px) {
          .c1, .c2 { display: none; }
          .visual-container { padding: 0 10px; }
          .primary-btn { padding: 10px 16px; font-size: 14px; }
          .terminal-content { padding: 20px; font-size: 12px; }
        }
      `}</style>
    </section>
  );
};
