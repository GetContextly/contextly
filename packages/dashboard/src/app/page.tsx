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

      <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold mb-2 text-blue-400">Passive Capture</h3>
          <p className="text-slate-400 text-sm">Git hooks and agent sessions automatically feed your project memory.</p>
        </div>
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold mb-2 text-purple-400">Agent Continuity</h3>
          <p className="text-slate-400 text-sm">Switch from Claude to Cursor without re-explaining your architecture.</p>
        </div>
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold mb-2 text-green-400">MCP Native</h3>
          <p className="text-slate-400 text-sm">Standardized protocol support for all modern AI coding tools.</p>
        </div>
      </section>

      <footer className="mt-24 text-slate-500 text-sm">
        © 2024 Contextly. Built for Claude, Cursor, and beyond.
      </footer>
    </div>
  );
}
