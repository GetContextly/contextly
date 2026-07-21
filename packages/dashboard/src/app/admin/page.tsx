'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SystemStats {
  users: number | null;
  projects: number | null;
  decisions: number | null;
  changes: number | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  user_id: string;
  metadata: any;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [users, projects, decisions, changes] = await Promise.all([
        supabase.from('profiles').select('count', { count: 'exact' }),
        supabase.from('projects').select('count', { count: 'exact' }),
        supabase.from('decisions').select('count', { count: 'exact' }),
        supabase.from('changes').select('count', { count: 'exact' }),
      ]);

      setStats({
        users: users.count,
        projects: projects.count,
        decisions: decisions.count,
        changes: changes.count,
      });

      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logs) setAuditLogs(logs);
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-signal-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="heading-m text-white mb-2">Admin Control Center</h1>
        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">System Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total Users', value: stats?.users ?? 0, icon: '👤' },
          { label: 'Active Projects', value: stats?.projects ?? 0, icon: '📁' },
          { label: 'Logged Decisions', value: stats?.decisions ?? 0, icon: '🧠' },
          { label: 'Total Syncs', value: stats?.changes ?? 0, icon: '🔄' },
        ].map((stat) => (
          <div key={stat.label} className="glass-dark rounded-3xl p-8 border-white/5">
            <div className="text-2xl mb-4 opacity-40">{stat.icon}</div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-2">{stat.label}</p>
            <p className="text-3xl font-display font-bold text-signal-green">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-display font-bold mb-6">Recent System Activity</h2>
        <div className="glass-dark rounded-[2rem] border-white/5 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/20 font-mono text-sm">No audit logs yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-8 py-4 flex items-center gap-6 hover:bg-white/[0.02] transition-colors">
                  <span className="text-[10px] font-mono text-white/30 w-32 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span className="px-2 py-1 rounded bg-signal-green/10 text-signal-green text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
                    {log.action}
                  </span>
                  <span className="text-xs text-white/40 font-mono shrink-0">{log.entity_type}</span>
                  <span className="text-xs text-white/20 font-mono truncate">{log.user_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
