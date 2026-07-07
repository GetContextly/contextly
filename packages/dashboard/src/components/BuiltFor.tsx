'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users2, Zap } from 'lucide-react';

export const BuiltFor = () => {
  const categories = [
    {
      icon: <Briefcase size={24} color="#34FFB3" />,
      title: "Freelancers & agencies",
      body: "Juggling multiple client codebases without losing track of what you decided and why."
    },
    {
      icon: <Users2 size={24} color="#7C8CFF" />,
      title: "Small-mid dev teams",
      body: "Using more than one AI coding tool and tired of inconsistent output between them."
    },
    {
      icon: <Zap size={24} color="#34FFB3" />,
      title: "Hackathon teams",
      body: "Need fast onboarding across multiple devs in a very short window."
    }
  ];

  return (
    <section className="built-for">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Built for</div>
          <h2>If you juggle more than one AI tool, this is for you.</h2>
        </div>

        <div className="categories-grid">
          {categories.map((cat, index) => (
            <motion.div
              key={index}
              className="category-card"
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="icon-wrapper">{cat.icon}</div>
              <h3>{cat.title}</h3>
              <p>{cat.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .built-for {
          padding: 120px 0;
          background: #0A0B0F;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
        }

        h2 {
          font-size: clamp(1.75rem, 4vw, 2.25rem);
          font-weight: 600;
          color: white;
          margin-top: 12px;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .category-card {
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 28px;
        }

        .icon-wrapper {
          margin-bottom: 24px;
        }

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }

        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .categories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
