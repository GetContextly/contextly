'use client';

import React from 'react';
import CircularGallery from './CircularGallery';
import { motion } from 'framer-motion';

export const SupportedAgents = () => {
  const agents = [
    { image: 'https://svgl.app/library/claude.svg', text: 'Claude Code' },
    { image: 'https://svgl.app/library/cursor.svg', text: 'Cursor' },
    { image: 'https://svgl.app/library/github-copilot.svg', text: 'Copilot' },
    { image: 'https://svgl.app/library/codeium.svg', text: 'Windsurf' },
    { image: 'https://svgl.app/library/zed.svg', text: 'Zed' },
    { image: 'https://svgl.app/library/sourcegraph.svg', text: 'Cody' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Aider', text: 'Aider' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Continue', text: 'Continue' },
  ];

  return (
    <section className="agents-section">
      <div className="container">
        <motion.div
          className="header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="eyebrow">Universal Connectivity</div>
          <h2 className="heading-m text-gradient">One Source of Truth <br />for Every Agent.</h2>
        </motion.div>

        <div className="gallery-container">
          <CircularGallery
            items={agents}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
          />
        </div>
      </div>

      <style jsx>{`
        .agents-section {
          padding: 100px 0;
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .header {
          text-align: center;
          margin-bottom: 80px;
        }

        .eyebrow {
          color: #34FFB3;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }

        .gallery-container {
          height: 600px;
          position: relative;
          width: 100%;
        }

        @media (max-width: 768px) {
          .gallery-container {
            height: 400px;
          }
        }
      `}</style>
    </section>
  );
};
