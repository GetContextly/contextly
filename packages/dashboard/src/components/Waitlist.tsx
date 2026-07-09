'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="waitlist-section">
      <div className="container">
        <motion.div
          className="cta-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="glow-circle" />

          <div className="cta-content">
            <h2 className="heading-m text-gradient">Ready to ship smarter?</h2>
            <p>Join 2,000+ developers waiting for a more coherent AI workflow. We're launching soon.</p>

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  className="waitlist-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit">Join the waitlist</button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  className="success-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="success-icon">✦</span>
                  <p>You're on the list. We'll be in touch soon.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="trust-badges">
              <span className="badge">✦ Early Bird Perks</span>
              <span className="badge">✦ No Credit Card Required</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .waitlist-section {
          padding: 160px 0;
          background: #0A0B0F;
          position: relative;
          overflow: hidden;
        }

        .cta-card {
          position: relative;
          background: linear-gradient(135deg, #12141C 0%, #0A0B0F 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 48px;
          padding: 120px 40px;
          text-align: center;
          overflow: hidden;
        }

        .glow-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: #34FFB3;
          filter: blur(120px);
          opacity: 0.1;
          pointer-events: none;
        }

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
          margin: 0 auto;
        }

        h2 {
          margin-bottom: 24px;
        }

        p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .waitlist-form {
          display: flex;
          gap: 16px;
          max-width: 500px;
          margin: 0 auto 40px;
        }

        .waitlist-form input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 24px;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .waitlist-form input:focus {
          border-color: #34FFB3;
        }

        .waitlist-form button {
          background: white;
          color: black;
          padding: 16px 32px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 16px;
          transition: transform 0.2s, background 0.2s;
        }

        .waitlist-form button:hover {
          transform: translateY(-2px);
          background: #34FFB3;
        }

        .success-state {
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .success-icon {
          font-size: 32px;
          color: #34FFB3;
        }

        .success-state p {
          color: #34FFB3;
          font-weight: 600;
          margin-bottom: 0;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 32px;
        }

        .badge {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        @media (max-width: 768px) {
          .waitlist-form {
            flex-direction: column;
          }
          .cta-card {
            padding: 80px 20px;
            border-radius: 32px;
          }
          .trust-badges {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
};
