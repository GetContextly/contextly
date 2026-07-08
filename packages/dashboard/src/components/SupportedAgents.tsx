'use client';

import React from 'react';
import CircularGallery from './CircularGallery';

export const SupportedAgents = () => {
  const agents = [
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Claude+Code', text: 'Claude Code' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=GitHub+Copilot', text: 'Copilot' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Cursor', text: 'Cursor' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Windsurf', text: 'Windsurf' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Aider', text: 'Aider' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Codex', text: 'Codex' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=OpenDevin', text: 'OpenDevin' },
    { image: 'https://placehold.co/800x600/12141C/34FFB3?text=Tabnine', text: 'Tabnine' },
  ];

  return (
    <section className="agents-section">
      <div className="container">
        <div className="header">
          <h2 className="title">Universal Context for All Agents</h2>
          <p className="description">
            Contextly provides a unified source of truth for every AI agent you use.
            No more manual re-indexing or explanation loops.
          </p>
        </div>

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
        }

        .header {
          text-align: center;
          margin-bottom: 60px;
        }

        .title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          margin-bottom: 20px;
          color: white;
        }

        .description {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
          max-width: 600px;
          margin: 0 auto;
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
