'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const Navbar = () => {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container nav-content">
        <Link href="/" className="brand">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 14C4 14 6 7 10 7C14 7 16 14 16 14" stroke="#34FFB3" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 6C4 6 6 13 10 13C14 13 16 6 16 6" stroke="#34FFB3" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <span>Contextly</span>
        </Link>

        <div className="nav-links">
          <Link href="https://github.com/GetContextly/contextly" className="nav-link">Docs</Link>
          <button className="waitlist-btn">Join Waitlist</button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(10, 11, 15, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-content {
          height: 72px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: white;
        }

        .logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: white;
        }

        .waitlist-btn {
          background: #34FFB3;
          color: black;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 999px;
          transition: transform 0.2s ease;
        }

        .waitlist-btn:hover {
          transform: scale(1.03);
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 16px;
          }
        }
      `}</style>
    </motion.nav>
  );
};
