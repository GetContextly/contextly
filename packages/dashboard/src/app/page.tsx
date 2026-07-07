import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <header className="mb-12">
        <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Contextly
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          Living project memory for AI coding agents. Architecture, decisions, and recent changes — always current.
        </p>
      </header>

      <main className="flex gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-all">
          Get Started
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-lg font-semibold transition-all border border-slate-700">
          View Docs
        </button>
      </main>

      <footer className="mt-24 text-slate-500 text-sm">
        © 2024 Contextly. Built for Claude, Cursor, and beyond.
      </footer>
    </div>
  );
}
