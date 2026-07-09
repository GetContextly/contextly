'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const GitHubIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">Contextly</div>
            <p>Living memory for the next <br />generation of AI-native developers.</p>
          </div>

          <div className="footer-grid">
            <div className="footer-col">
              <h4>Product</h4>
              <Link href="/docs">Documentation</Link>
              <Link href="/changelog">Changelog</Link>
              <Link href="/mcp">MCP Protocol</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="mailto:hello@getcontextly.dev">Contact</Link>
              <Link href="https://twitter.com/getcontextly">Twitter</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Contextly. All rights reserved.</p>
          <div className="socials">
            <Link href="https://github.com/GetContextly/contextly" className="social-link">
              <GitHubIcon size={18} />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #0A0B0F;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 100px 0 60px;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 80px;
          gap: 60px;
        }

        .footer-brand {
          max-width: 300px;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .footer-brand p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.6;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 60px;
        }

        .footer-col h4 {
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
        }

        .footer-col :global(a) {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
          transition: color 0.2s;
        }

        .footer-col :global(a:hover) {
          color: #34FFB3;
        }

        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-bottom p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        .social-link {
          color: rgba(255, 255, 255, 0.3);
          transition: color 0.2s;
        }

        .social-link:hover {
          color: white;
        }

        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            gap: 60px;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
      `}</style>
    </footer>
  );
};
