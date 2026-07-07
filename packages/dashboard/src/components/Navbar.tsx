import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-6 bg-slate-950 border-b border-slate-900">
      <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Contextly
      </Link>
      <div className="flex gap-6 items-center">
        <Link href="/docs" className="text-slate-400 hover:text-white transition-colors">Docs</Link>
        <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium">
          Sign In
        </button>
      </div>
    </nav>
  );
};
