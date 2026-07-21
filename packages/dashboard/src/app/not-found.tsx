'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06070a] flex items-center justify-center p-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-8xl font-display font-black text-white/[0.03] mb-8">
          404
        </div>
        <h1 className="text-3xl font-display font-bold mb-4">Page not found</h1>
        <p className="text-white/40 text-sm mb-10 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-signal-green text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(52,255,179,0.2)]"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
