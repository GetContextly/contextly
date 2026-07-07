'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

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
      <div className="radial-glow" />
      <div className="container">
        <motion.div
          className="waitlist-content"
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Be first to plug your agents in.</h2>
          <p className="subtext">
            We're not live yet. Join the waitlist and you'll get one email the moment Contextly is ready.
          </p>

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
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Join the waitlist</button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                className="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 size={32} color="#34FFB3" />
                <p>You're on the list. We'll email you at <strong>{email}</strong> when it's ready.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="disclaimer">No spam. Unsubscribe anytime.</p>
        </motion.div>
      </div>

      <style jsx>{`
        .waitlist-section {
          padding: 120px 0;
          background: #0A0B0F;
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .radial-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: #34FFB3;
          filter: blur(100px);
          opacity: 0.08;
          z-index: 0;
          border-radius: 50%;
        }

        .waitlist-content {
          position: relative;
          z-index: 1;
          max-width: 560px;
          margin: 0 auto;
        }

        h2 {
          font-size: clamp(1.75rem, 4.5vw, 2.5rem);
          font-weight: 600;
          color: white;
          margin-bottom: 16px;
        }

        .subtext {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 40px;
        }

        .waitlist-form {
          display: flex;
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 6px;
          margin-bottom: 24px;
        }

        .waitlist-form input {
          background: transparent;
          border: none;
          padding: 14px 24px;
          color: white;
          flex: 1;
          font-size: 15px;
          outline: none;
        }

        .waitlist-form button {
          background: #34FFB3;
          color: black;
          padding: 14px 28px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 15px;
          transition: transform 0.2s ease;
        }

        .waitlist-form button:hover {
          transform: scale(1.02);
        }

        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px;
          color: white;
          font-size: 16px;
          font-weight: 500;
        }

        .disclaimer {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .waitlist-form {
            flex-direction: column;
            background: transparent;
            border: none;
            padding: 0;
            gap: 12px;
          }
          .waitlist-form input {
            background: #12141C;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
          }
          .waitlist-form button {
            border-radius: 12px;
          }
          .waitlist-section {
            padding: 64px 0;
          }
        }
      `}</style>
    </section>
  );
};
