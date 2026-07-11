'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasGitHub, setHasGitHub] = useState(false);
  const DUMMY_KEY = 'ctx_7f1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z';

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const gh = user.identities?.find(id => id.provider === 'github');
        setHasGitHub(!!gh);
      }
    }
    getData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(DUMMY_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/dashboard/settings',
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(DUMMY_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="heading-m text-white mb-2">Settings</h1>
        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Personal Account & Security</p>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <section>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">👤</span>
            Profile Information
          </h3>
          <div className="glass-dark rounded-[2rem] p-8 border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.user_metadata?.full_name || ''}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-signal-green/50 outline-none transition-all text-white/80"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Email Address</label>
                <input
                  type="email"
                  disabled
                  defaultValue={user?.email || ''}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white/30 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold mb-1">GitHub Connection</h4>
                <p className="text-xs text-white/30">
                  {hasGitHub ? 'Your account is linked to GitHub.' : 'Connect GitHub to enable automated context syncing.'}
                </p>
              </div>
              {hasGitHub ? (
                <div className="flex items-center gap-2 text-signal-green text-[10px] font-mono font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-signal-green" />
                  Connected
                </div>
              ) : (
                <button
                  onClick={handleLinkGitHub}
                  className="px-6 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-all"
                >
                  Connect GitHub
                </button>
              )}
            </div>
          </div>
        </section>

        {/* API & Access Section */}
        <section>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">🔑</span>
            CLI & Agent Access
          </h3>
          <div className="glass-dark rounded-[2rem] p-8 border-white/5">
            <div className="mb-8">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Personal Access Token</label>
              <p className="text-xs text-white/40 mb-4">This token is used to authenticate the CLI. Keep it secret.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black rounded-xl px-4 py-3 font-mono text-sm text-signal-green/70 flex items-center overflow-hidden border border-white/5">
                  <span className="truncate">{copied ? DUMMY_KEY : '••••••••••••••••••••••••••••••••'}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-signal-green/5 border border-signal-green/10">
              <h4 className="text-sm font-bold text-signal-green mb-2">Security Tip</h4>
              <p className="text-xs text-signal-green/60 leading-relaxed">
                If you believe your token has been compromised, you can revoke it and generate a new one. This will immediately disconnect any active CLI sessions.
              </p>
              <button className="mt-4 text-xs font-bold text-signal-green underline underline-offset-4 hover:opacity-80 transition-opacity">
                Revoke and Regenerate
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-red-500/80">
            <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">⚠</span>
            Danger Zone
          </h3>
          <div className="glass-dark rounded-[2rem] p-8 border-red-500/10 bg-red-500/[0.02]">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold mb-1">Delete Account</h4>
                <p className="text-xs text-white/30">Permanently remove all your projects and data.</p>
              </div>
              <button className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
