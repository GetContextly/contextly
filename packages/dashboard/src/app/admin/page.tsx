'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
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
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) return <div>Loading system stats...</div>;

  return (
    <div className="admin-view">
      <h1>Admin Control Center</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="label">Total Users</span>
          <span className="value">{stats.users}</span>
        </div>
        <div className="stat-card">
          <span className="label">Active Projects</span>
          <span className="value">{stats.projects}</span>
        </div>
        <div className="stat-card">
          <span className="label">Logged Decisions</span>
          <span className="value">{stats.decisions}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Syncs</span>
          <span className="value">{stats.changes}</span>
        </div>
      </div>

      <section className="audit-section">
        <h2>Recent System Activity</h2>
        <div className="audit-list">
          {/* Audit logs would be fetched and mapped here */}
          <div className="audit-item">
            <span className="timestamp">Just now</span>
            <span className="action">AGENT_CONTEXT_ACCESS</span>
            <span className="detail">Project: Contextly-Core</span>
          </div>
        </div>
      </section>

      <style jsx>{`
        .admin-view {
          padding: 40px;
          background: #0A0B0F;
          min-height: 100vh;
          color: white;
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 48px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 64px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 32px;
          border-radius: 16px;
        }

        .label {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .value {
          font-size: 36px;
          font-weight: 700;
          color: #34FFB3;
        }

        h2 {
          font-size: 18px;
          margin-bottom: 24px;
          color: rgba(255, 255, 255, 0.6);
        }

        .audit-list {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .audit-item {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 24px;
          font-size: 13px;
        }

        .timestamp { color: rgba(255, 255, 255, 0.3); }
        .action { color: #34FFB3; font-weight: 600; }
      `}</style>
    </div>
  );
}
