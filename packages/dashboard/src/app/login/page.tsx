'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header">
          <h1>Welcome to Contextly</h1>
          <p>Sign in to manage your project memory.</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button
          className="btn-github"
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          {loading ? 'Connecting...' : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </>
          )}
        </button>

        <div className="footer">
          By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
        </div>
      </motion.div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #0A0B0F;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 48px;
          max-width: 440px;
          width: 100%;
          text-align: center;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .header p {
          color: rgba(255, 255, 255, 0.4);
          font-size: 16px;
          margin-bottom: 40px;
        }

        .error-box {
          background: rgba(255, 52, 52, 0.1);
          border: 1px solid rgba(255, 52, 52, 0.2);
          color: #ff5252;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .btn-github {
          width: 100%;
          background: white;
          color: black;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-github:hover {
          background: #f0f0f0;
          transform: translateY(-2px);
        }

        .btn-github:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .footer {
          margin-top: 32px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.5;
        }

        .footer a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
        }

        .footer a:hover {
          color: white;
        }
      `}</style>
    </div>
  );
}
