'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <div className="container">
        <div className="footer-top">
          <div className="brand-column">
            <div className="brand">Contextly</div>
            <p className="tagline">Living memory for AI coding agents.</p>
          </div>

          <div className="links-row">
            <Link href="https://github.com/GetContextly/contextly" className="footer-link">
              <Github size={16} />
              <span>GitHub</span>
            </Link>
            <a href="mailto:hello@getcontextly.dev" className="footer-link">Contact</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Contextly.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 40px 0;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .brand {
          font-size: 15px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .tagline {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        .links-row {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .footer-link {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: white;
        }

        .footer-bottom {
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .footer-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          .links-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </motion.footer>
  );
};
