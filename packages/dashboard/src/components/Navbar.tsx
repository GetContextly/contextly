'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Outer bezel */}
        <div className="island-outer">
          {/* Inner pill */}
          <div className="island-inner">
            {/* Logo */}
            <Link href="/" className="brand">
              <div className="logo-mark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4V20M4 12H20" stroke="#34FFB3" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="#34FFB3" strokeWidth="2" strokeDasharray="2 4" opacity="0.5"/>
                </svg>
              </div>
              <span className="brand-text">Contextly</span>
            </Link>

            {/* Center nav links */}
            <div className="nav-links">
              <div className="nav-divider-left" />
              <Link href="/docs" className="nav-link">Documentation</Link>
              <Link href="/changelog" className="nav-link">Changelog</Link>
              <div className="nav-divider-right" />
            </div>

            {/* Right side: GitHub + CTA */}
            <div className="nav-actions">
              <Link
                href="https://github.com/GetContextly/contextly"
                className="github-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </Link>

              <button className="waitlist-btn">
                <span className="waitlist-btn-label">Join Waitlist</span>
                <span className="waitlist-btn-arrow">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={`hamburger-line ${mobileMenuOpen ? 'open-top' : ''}`} />
                <span className={`hamburger-line ${mobileMenuOpen ? 'open-mid' : ''}`} />
                <span className={`hamburger-line ${mobileMenuOpen ? 'open-bot' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mobile-menu-inner">
              <Link href="/docs" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Documentation
              </Link>
              <Link href="/changelog" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Changelog
              </Link>
              <div className="mobile-divider" />
              <Link
                href="https://github.com/GetContextly/contextly"
                className="mobile-nav-link"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>GitHub</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <style jsx>{`
        /* ── Fixed positioning: floating island ── */
        .navbar {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: max-content;
          max-width: calc(100vw - 32px);
        }

        /* ── Outer bezel shell ── */
        .island-outer {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          padding: 3px;
        }

        /* ── Inner pill core ── */
        .island-inner {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(18, 20, 28, 0.92);
          border-radius: 9999px;
          padding: 6px 6px 6px 14px;
          backdrop-filter: blur(24px) saturate(180%);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.08),
            0 8px 40px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* ── Brand / Logo ── */
        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(52, 255, 179, 0.08);
          border: 1px solid rgba(52, 255, 179, 0.15);
          flex-shrink: 0;
          transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand:hover .logo-mark {
          background: rgba(52, 255, 179, 0.14);
          border-color: rgba(52, 255, 179, 0.3);
        }

        .brand-text {
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.025em;
          white-space: nowrap;
          transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand:hover .brand-text {
          color: #ffffff;
        }

        /* ── Center nav links ── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .nav-divider-left,
        .nav-divider-right {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.08);
          margin: 0 10px;
          flex-shrink: 0;
        }

        .nav-link {
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 9999px;
          white-space: nowrap;
          transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-link:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.05);
        }

        /* ── Right actions cluster ── */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 4px;
        }

        /* GitHub icon link */
        .github-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .github-link:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.06);
        }

        /* CTA button — pill with arrow capsule */
        .waitlist-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 9999px;
          padding: 8px 8px 8px 16px;
          cursor: pointer;
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
          white-space: nowrap;
          transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .waitlist-btn:hover {
          background: #34FFB3;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(52, 255, 179, 0.25);
        }

        .waitlist-btn-label {
          line-height: 1;
        }

        .waitlist-btn-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .waitlist-btn:hover .waitlist-btn-arrow {
          transform: translateX(2px) translateY(-1px) scale(1.05);
        }

        /* ── Mobile hamburger toggle ── */
        .mobile-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .hamburger-line {
          display: block;
          width: 14px;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 2px;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .open-top {
          transform: translateY(5.5px) rotate(45deg);
        }

        .open-mid {
          opacity: 0;
          transform: scaleX(0);
        }

        .open-bot {
          transform: translateY(-5.5px) rotate(-45deg);
        }

        /* ── Mobile dropdown ── */
        .mobile-menu {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: max(260px, 100%);
        }

        .mobile-menu-inner {
          background: rgba(18, 20, 28, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 8px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-inter, Inter, sans-serif);
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          padding: 11px 16px;
          border-radius: 12px;
          transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-nav-link:hover {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.05);
        }

        .mobile-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 4px 8px;
        }

        /* ── Responsive: hide/show ── */
        @media (max-width: 768px) {
          .island-inner {
            padding: 5px 5px 5px 12px;
            gap: 8px;
          }

          .nav-links {
            display: none;
          }

          .github-link {
            display: none;
          }

          .mobile-toggle {
            display: flex;
          }

          .waitlist-btn {
            padding: 7px 7px 7px 14px;
            font-size: 12.5px;
          }

          .waitlist-btn-arrow {
            width: 24px;
            height: 24px;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu {
            display: none;
          }
        }
      `}</style>
    </>
  );
};
