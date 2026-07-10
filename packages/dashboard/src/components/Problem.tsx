'use client';

import React from 'react';
import { motion } from 'framer-motion';

const cards = [
  {
    title: "The Explainer's Loop",
    body: "Every time you open a new chat or switch from Claude to Cursor, you spend 5 minutes copying snippets and explaining 'No, we use Supabase, not Firebase.'",
    tag: 'Time Sink',
  },
  {
    title: 'Context Decay',
    body: "Your README says one thing, your current branch says another. AI agents hallucinate because they're reading stale documentation from 3 weeks ago.",
    tag: 'Stale Data',
  },
  {
    title: 'Fragmented Intent',
    body: "You decided on a specific architectural pattern yesterday. Today, your agent suggests a completely different approach because it doesn't know why you chose the first one.",
    tag: 'Broken Sync',
  },
];

export const Problem = () => {
  return (
    <section className="problem-section">
      <div className="container">
        <div className="section-grid">

          {/* LEFT — sticky heading block */}
          <div className="heading-col">
            <div className="heading-sticky">
              {/* Eyebrow pill */}
              <motion.div
                className="eyebrow-pill"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                The Status Quo
              </motion.div>

              {/* H2 */}
              <motion.h2
                className="heading"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                Why AI coding
                <br />
                <span className="heading-dim">feels broken.</span>
              </motion.h2>

              {/* Sub-paragraph */}
              <motion.p
                className="sub"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                The context problem isn't an AI problem —<br />
                it's an infrastructure problem.
              </motion.p>
            </div>
          </div>

          {/* RIGHT — scrolling cards */}
          <div className="cards-col">
            {cards.map((card, i) => (
              <motion.div
                key={card.tag}
                className="card-outer"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.75,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="card-inner">
                  {/* Tag */}
                  <span className="card-tag">{card.tag}</span>

                  {/* Title */}
                  <h3 className="card-title">{card.title}</h3>

                  {/* Body */}
                  <p className="card-body">{card.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      <style jsx>{`
        /* ─── Section ────────────────────────────────────────── */
        .problem-section {
          padding: 128px 0 160px;
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          position: relative;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 48px;
        }

        /* ─── Two-column grid ────────────────────────────────── */
        .section-grid {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 80px;
          align-items: start;
        }

        /* ─── Left column (sticky) ───────────────────────────── */
        .heading-col {
          /* Allows inner sticky to work */
        }

        .heading-sticky {
          position: sticky;
          top: 120px;
        }

        /* Eyebrow pill */
        .eyebrow-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          padding: 4px 14px;
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #34FFB3;
          border: 1px solid rgba(52, 255, 179, 0.2);
          background: rgba(52, 255, 179, 0.06);
          margin-bottom: 28px;
        }

        /* H2 */
        .heading {
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
          background: linear-gradient(135deg, #ffffff 40%, rgba(255, 255, 255, 0.55) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .heading-dim {
          background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Sub paragraph */
        .sub {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.8rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.38);
          margin: 0;
        }

        /* ─── Right column (cards) ───────────────────────────── */
        .cards-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ─── Double-bezel card ──────────────────────────────── */
        .card-outer {
          border-radius: 2rem;
          background: rgba(255, 255, 255, 0.03);
          /* ring-1 ring-white/8 */
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          padding: 8px; /* p-2 */
          transition:
            box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
            background 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-outer:hover {
          box-shadow: 0 0 0 1px rgba(52, 255, 179, 0.25);
          background: rgba(52, 255, 179, 0.03);
        }

        .card-inner {
          border-radius: calc(2rem - 0.5rem);
          background: #12141C;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.07);
          padding: 36px 36px 40px;
          transition: background 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-outer:hover .card-inner {
          background: rgba(18, 20, 28, 1);
          /* subtle green tint blended in */
          background: color-mix(in srgb, #12141C 98%, #34FFB3 2%);
        }

        /* Tag pill inside card */
        .card-tag {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          padding: 3px 10px;
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #34FFB3;
          border: 1px solid rgba(52, 255, 179, 0.2);
          background: rgba(52, 255, 179, 0.06);
          margin-bottom: 20px;
        }

        /* Card title */
        .card-title {
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 1.4rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 14px;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        /* Card body */
        .card-body {
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* ─── Mobile ─────────────────────────────────────────── */
        @media (max-width: 768px) {
          .problem-section {
            padding: 96px 0 112px;
          }

          .container {
            padding: 0 16px;
          }

          .section-grid {
            grid-template-columns: 1fr;
            gap: 52px;
          }

          .heading-sticky {
            position: static;
            top: auto;
          }

          .heading {
            font-size: 2.2rem;
          }

          .card-inner {
            padding: 28px 24px 32px;
          }
        }
      `}</style>
    </section>
  );
};
