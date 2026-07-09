'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const BuiltFor = () => {
  const users = [
    {
      title: "Solopreneurs",
      description: "When you're building alone, you're the architect, the dev, and the PM. Contextly ensures your AI agent knows as much about the 'why' as you do.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Fast-moving Teams",
      description: "Ship faster by eliminating the onboarding tax. New team members (and their AI tools) get the full picture in seconds, not days.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <section className="built-for">
      <div className="container">
        <div className="header">
          <div className="eyebrow">User Profiles</div>
          <h2 className="heading-m text-gradient">Built for the next <br />generation of shipping.</h2>
        </div>

        <div className="bento-grid">
          {users.map((user, index) => (
            <motion.div
              key={index}
              className="bento-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className="card-image">
                <img src={user.image} alt={user.title} />
                <div className="overlay" />
              </div>
              <div className="card-content">
                <h3>{user.title}</h3>
                <p>{user.description}</p>
              </div>
            </motion.div>
          ))}

          <motion.div
            className="bento-card full-width"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="content-side">
              <span className="mini-tag">Open Source</span>
              <h3>Community First.</h3>
              <p>Contextly is built in the open. We believe project memory should be as portable as your code. No vendor lock-in, just pure context.</p>
              <button className="secondary-btn">View on GitHub</button>
            </div>
            <div className="visual-side">
              <div className="github-mockup">
                <div className="mock-row"><div className="m-dot"/> contextly.config.json</div>
                <div className="mock-row"><div className="m-dot"/> .contextly/history</div>
                <div className="mock-row"><div className="m-dot"/> mcp-server.ts</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .built-for {
          padding: 160px 0;
          background: #0A0B0F;
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

        .bento-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .bento-card {
          background: #12141C;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-image {
          height: 240px;
          position: relative;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(100%) contrast(1.2);
          opacity: 0.5;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, #12141C);
        }

        .card-content {
          padding: 40px;
        }

        .full-width {
          grid-column: span 2;
          flex-direction: row;
          align-items: center;
          background: linear-gradient(90deg, #12141C 0%, #1A1D26 100%);
        }

        .content-side {
          flex: 1;
          padding: 60px;
        }

        .visual-side {
          flex: 1;
          padding: 60px;
          display: flex;
          justify-content: center;
        }

        .mini-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #34FFB3;
          margin-bottom: 20px;
          display: block;
        }

        h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
        }

        p {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .secondary-btn {
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 12px 24px;
          border-radius: 100px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .github-mockup {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 300px;
        }

        .mock-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }

        .m-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
            flex-direction: column;
          }
          .content-side, .visual-side {
            padding: 40px;
          }
        }
      `}</style>
    </section>
  );
};
