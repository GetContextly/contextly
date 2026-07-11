'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { use } from 'react';

interface Project {
  id: string;
  name: string;
  mcp_token: string;
}

interface Decision {
  id: string;
  summary: string;
  reasoning: string;
  created_at: string;
  related_files: string[];
}

interface Change {
  id: string;
  summary: string;
  commit_sha: string;
  created_at: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [projRes, decRes, changeRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('decisions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('changes').select('*').eq('project_id', id).order('created_at', { ascending: false })
      ]);

      if (projRes.data) setProject(projRes.data);
      if (decRes.data) setDecisions(decRes.data);
      if (changeRes.data) setChanges(changeRes.data);

      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Loading project details...</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="project-detail">
      <div className="header">
        <div className="breadcrumb">Projects / {project.name}</div>
        <h1>{project.name}</h1>
        <div className="mcp-token-box">
          <span>MCP Token: <code>{project.mcp_token}</code></span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="label">Total Decisions</span>
          <span className="value">{decisions.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total Changes</span>
          <span className="value">{changes.length}</span>
        </div>
        <div className="stat-card">
          <span className="label">Active Session</span>
          <span className="value status">Online</span>
        </div>
      </div>

      <div className="content-grid">
        <section className="decisions-section">
          <h2>Architectural Decisions</h2>
          <div className="decision-list">
            {decisions.length === 0 ? (
              <p className="empty-msg">No decisions logged yet.</p>
            ) : (
              decisions.map(d => (
                <div key={d.id} className="decision-item">
                  <div className="item-header">
                    <h4>{d.summary}</h4>
                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <p>{d.reasoning}</p>
                  <div className="files">
                    {d.related_files?.map((f: string) => <span key={f} className="file-tag">{f}</span>)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="changes-section">
          <h2>Recent Activity</h2>
          <div className="change-list">
            {changes.length === 0 ? (
              <p className="empty-msg">No activity synced yet.</p>
            ) : (
              changes.map(c => (
                <div key={c.id} className="change-item">
                  <div className="commit-sha">{c.commit_sha?.substring(0, 7) || 'manual'}</div>
                  <div className="change-info">
                    <p>{c.summary}</p>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 40px;
        }

        .breadcrumb {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 12px;
        }

        h1 {
          font-size: 32px;
          margin-bottom: 16px;
        }

        .mcp-token-box {
          background: rgba(52, 255, 179, 0.05);
          border: 1px solid rgba(52, 255, 179, 0.1);
          padding: 12px 20px;
          border-radius: 8px;
          display: inline-block;
          font-size: 13px;
        }

        .mcp-token-box code {
          color: #34FFB3;
          margin-left: 12px;
          font-family: var(--font-mono);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 24px;
          border-radius: 12px;
        }

        .stat-card .label {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-card .value {
          font-size: 24px;
          font-weight: 700;
        }

        .stat-card .value.status {
          color: #34FFB3;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }

        h2 {
          font-size: 18px;
          margin-bottom: 24px;
          color: rgba(255, 255, 255, 0.6);
        }

        .decision-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .item-header h4 {
          font-size: 16px;
          font-weight: 600;
        }

        .item-header span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        .decision-item p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .file-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          background: rgba(52, 255, 179, 0.1);
          color: #34FFB3;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 8px;
        }

        .change-item {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .commit-sha {
          font-family: var(--font-mono);
          font-size: 11px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          height: fit-content;
          color: rgba(255, 255, 255, 0.5);
        }

        .change-info p {
          font-size: 13px;
          margin-bottom: 4px;
        }

        .change-info span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
        }

        .empty-msg {
          color: rgba(255, 255, 255, 0.2);
          font-style: italic;
          font-size: 14px;
        }

        .loading {
          padding: 100px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
