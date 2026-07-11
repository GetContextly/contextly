'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'github' | 'google') => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

  return (
    <div className="login-page">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(52,255,179,0.05),transparent_50%)] pointer-events-none" />

      <motion.div
        className="login-card relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="header mb-10">
          <div className="logo mb-8 flex justify-center">
            <div className="w-12 h-12 rounded-2xl bg-signal-green flex items-center justify-center text-black font-black text-2xl">C</div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/40 text-sm">Access your project memory.</p>
        </div>

        {error && <div className="error-box mb-6">{error}</div>}

        <div className="flex flex-col gap-4">
          <button
            className="btn-auth github"
            onClick={() => handleLogin('github')}
            disabled={!!loading}
          >
            {loading === 'github' ? 'Connecting...' : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </>
            )}
          </button>

          <button
            className="btn-auth google"
            onClick={() => handleLogin('google')}
            disabled={!!loading}
          >
            {loading === 'google' ? 'Connecting...' : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 3.86-.98 5.15-2.67l-3.57-2.77c-.98.66-2.23 1.06-3.58 1.06-2.76 0-5.09-1.86-5.93-4.36H.47v2.77C2.26 20.55 6.83 23 12 23z"/>
                  <path fill="#FBBC05" d="M6.07 14.26c-.22-.66-.35-1.36-.35-2.26s.13-1.6.35-2.26V7.01H.47C-.17 8.51-.53 10.22-.53 12s.36 3.49 1 4.99l5.6-2.73z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 6.83 1 2.26 3.45.47 7.01l5.6 2.73c.84-2.5 3.17-4.36 5.93-4.36z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="footer mt-10">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
            Contextly Core Security Layer
          </p>
        </div>
      </motion.div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #06070a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          padding: 56px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
        }

        .error-box {
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.2);
          color: #ff5252;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
        }

        .btn-auth {
          width: 100%;
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .github {
          background: white;
          color: black;
        }

        .google {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
        }

        .btn-auth:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .github:hover {
          background: #f0f0f0;
        }

        .google:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }

        .btn-auth:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}
