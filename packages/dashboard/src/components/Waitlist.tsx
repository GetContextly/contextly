'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;
    setIsLoading(true);
    setError('');

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim(), source: 'landing_page' });

    if (error) {
      if (error.code === '23505') {
        // Unique violation — already on the list
        setSubmitted(true); // Show success anyway
      } else {
        setError('Something went wrong. Please try again.');
      }
    } else {
      setSubmitted(true);
    }
    setIsLoading(false);
  };

  return (
    <section className="waitlist-section">
      <div className="container">
        {/* Outer bezel shell */}
        <motion.div
          className="outer-shell"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
        >
          {/* Inner core */}
          <div className="inner-core">
            {/* Background radial glow */}
            <div className="glow-orb" aria-hidden="true" />

            {/* Content */}
            <div className="content-wrap">
              {/* Eyebrow pill */}
              <motion.div
                className="eyebrow-pill"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease, delay: 0.1 }}
              >
                Early Access Open
              </motion.div>

              {/* Headline */}
              <motion.h2
                className="headline"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: 0.2 }}
              >
                Ship with full context.<br />Every session.
              </motion.h2>

              {/* Subtext */}
              <motion.p
                className="subtext"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: 0.3 }}
              >
                Join developers who never lose their place between AI sessions.
              </motion.p>

              {/* Form / Success */}
              <motion.div
                className="form-area"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.form
                      key="form"
                      className="pill-form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      {/* Outer pill ring */}
                      <div className="pill-wrapper">
                        <input
                          type="email"
                          className="email-input"
                          placeholder="Enter your work email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          disabled={isLoading}
                        />
                        {/* Submit button — button-in-button pattern */}
                        <button type="submit" className="submit-btn" disabled={isLoading}>
                          <span className="btn-label">{isLoading ? 'Joining...' : 'Join the waitlist'}</span>
                          {!isLoading && (
                            <span className="btn-icon-wrap" aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </div>
                      {error && (
                        <p className="error-msg">{error}</p>
                      )}
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      className="success-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease }}
                    >
                      <span className="check-icon" aria-label="Success">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="16" cy="16" r="15" stroke="#34FFB3" strokeWidth="1.5" />
                          <path d="M10 16.5l4.5 4.5 7.5-9" stroke="#34FFB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <p className="success-headline">You&apos;re in.</p>
                      <p className="success-sub">We&apos;ll reach out soon.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Trust row */}
              <motion.div
                className="trust-row"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: 0.5 }}
              >
                <span className="trust-badge">No credit card</span>
                <span className="trust-divider" aria-hidden="true" />
                <span className="trust-badge">Cancel anytime</span>
                <span className="trust-divider" aria-hidden="true" />
                <span className="trust-badge">2,400+ on waitlist</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .waitlist-section {
          padding: 160px 0;
          background: #0A0B0F;
          position: relative;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Double-bezel architecture ── */
        .outer-shell {
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          border-radius: 3rem;
          padding: 0.5rem;
        }

        .inner-core {
          position: relative;
          background: #12141C;
          border-radius: calc(3rem - 0.5rem);
          padding: 128px 64px;
          text-align: center;
          overflow: hidden;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        /* ── Background glow ── */
        .glow-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: #34FFB3;
          filter: blur(140px);
          opacity: 0.08;
          pointer-events: none;
          border-radius: 50%;
        }

        /* ── Content ── */
        .content-wrap {
          position: relative;
          z-index: 2;
          max-width: 620px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* ── Eyebrow pill ── */
        .eyebrow-pill {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #34FFB3;
          background: rgba(52, 255, 179, 0.08);
          border: 1px solid rgba(52, 255, 179, 0.2);
          border-radius: 9999px;
          padding: 6px 14px;
          margin-bottom: 28px;
        }

        /* ── Headline ── */
        .headline {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 20px;
        }

        /* ── Subtext ── */
        .subtext {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 1.0625rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.65;
          margin: 0 0 44px;
          max-width: 480px;
        }

        /* ── Form area ── */
        .form-area {
          width: 100%;
          max-width: 540px;
          margin-bottom: 32px;
        }

        /* ── Pill form ── */
        .pill-form {
          width: 100%;
        }

        .pill-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 6px 6px 6px 20px;
          transition: border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pill-wrapper:focus-within {
          border-color: rgba(52, 255, 179, 0.35);
        }

        .email-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 15px;
          font-weight: 400;
          min-width: 0;
        }

        .email-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        /* ── Submit button — button-in-button ── */
        .submit-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #34FFB3;
          color: #000;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 9999px;
          padding: 12px 8px 12px 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(52, 255, 179, 0.25);
        }

        .btn-label {
          line-height: 1;
        }

        /* Icon circle — inner ring of the button-in-button pattern */
        .btn-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.12);
          color: #000;
          flex-shrink: 0;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .submit-btn:hover .btn-icon-wrap {
          transform: translate(1px, -1px) scale(1.05);
        }

        /* ── Error message ── */
        .error-msg {
          margin: 10px 0 0;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 13px;
          color: #ff6b6b;
          text-align: center;
        }

        /* ── Disabled state ── */
        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .email-input:disabled {
          opacity: 0.5;
        }

        /* ── Success state ── */
        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 0;
        }

        .check-icon {
          display: block;
          line-height: 0;
        }

        .success-headline {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .success-sub {
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
        }

        /* ── Trust row ── */
        .trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .trust-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.3);
        }

        .trust-divider {
          display: block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .waitlist-section {
            padding: 96px 0;
          }

          .container {
            padding: 0 16px;
          }

          .outer-shell {
            border-radius: 2rem;
          }

          .inner-core {
            border-radius: calc(2rem - 0.5rem);
            padding: 72px 24px;
          }

          .pill-wrapper {
            flex-direction: column;
            border-radius: 24px;
            padding: 12px;
            align-items: stretch;
          }

          .email-input {
            padding: 12px 8px;
            font-size: 16px; /* prevent iOS zoom */
          }

          .submit-btn {
            width: 100%;
            justify-content: center;
            padding: 14px 20px;
          }

          .trust-row {
            gap: 12px;
          }

          .trust-divider {
            display: none;
          }

          .trust-badge {
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
};
