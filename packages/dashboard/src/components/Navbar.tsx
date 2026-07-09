'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const Navbar = () => {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className="container nav-content">
        <Link href="/" className="brand">
          <div className="logo-mark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4V20M4 12H20" stroke="#34FFB3" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="#34FFB3" strokeWidth="2" strokeDasharray="2 4" opacity="0.5"/>
            </svg>
          </div>
          <span className="brand-text">Contextly</span>
        </Link>

        <div className="nav-links">
          <Link href="/docs" className="nav-link">Documentation</Link>
          <Link href="/changelog" className="nav-link">Changelog</Link>
          <div className="divider" />
          <Link href="https://github.com/GetContextly/contextly" className="github-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </Link>
          <button className="waitlist-btn">
            Get Started
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(10, 11, 15, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-content {
          height: 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-text {
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: white;
        }

        .divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
        }

        .github-link {
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.2s;
        }

        .github-link:hover {
          color: white;
        }

        .waitlist-btn {
          background: white;
          color: black;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 8px;
          transition: transform 0.2s, background 0.2s;
        }

        .waitlist-btn:hover {
          transform: translateY(-1px);
          background: #34FFB3;
        }

        @media (max-width: 768px) {
          .nav-link, .divider, .github-link {
            display: none;
          }
        }
      `}</style>
    </motion.nav>
  );
};
