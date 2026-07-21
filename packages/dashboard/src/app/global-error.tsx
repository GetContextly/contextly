'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#06070a] flex items-center justify-center p-6 text-white">
        <div className="text-center max-w-md">
          <div className="text-6xl font-display font-black text-red-500/20 mb-8">
            !
          </div>
          <h1 className="text-2xl font-display font-bold mb-4">Something went wrong</h1>
          <p className="text-white/40 text-sm mb-8">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-2xl bg-signal-green text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
