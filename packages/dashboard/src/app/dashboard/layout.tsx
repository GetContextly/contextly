'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Projects', href: '/dashboard', icon: '◈' },
  { name: 'Installations', href: '/dashboard/installations', icon: '🔌' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#06070a] text-white font-sans selection:bg-signal-green/20 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-[#0A0B0F]/50 backdrop-blur-xl">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-signal-green/10 border border-signal-green/20 flex items-center justify-center group-hover:border-signal-green/50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 4V20M4 12H20" stroke="#34FFB3" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Contextly</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20">Menu</span>
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-signal-green/5 text-signal-green border border-signal-green/10 shadow-[0_0_20px_rgba(52,255,179,0.05)]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                }`}
              >
                <span className={`text-lg ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-signal-green shadow-[0_0_8px_#34FFB3]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="glass-dark rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-signal-green to-accent-blue flex items-center justify-center text-black font-bold text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">John Dev</p>
              <p className="text-[10px] font-mono text-white/30 truncate">PRO PLAN</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#06070a]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
             {/* Breadcrumbs can go here */}
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">
              Documentation
            </button>
            <button className="px-4 py-2 rounded-lg bg-signal-green text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(52,255,179,0.2)]">
              Support
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-10">
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
