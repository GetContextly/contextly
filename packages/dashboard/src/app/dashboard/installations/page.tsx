'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Installation {
  id: string;
  account_login: string;
  target_type: string;
  repository_selection: string;
}

export default function GitHubInstallationsPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstallations() {
      const { data, error } = await supabase
        .from('github_installations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInstallations(data);
      }
      setLoading(false);
    }

    fetchInstallations();
  }, []);

  const handleInstall = () => {
    // Replace with real GitHub App name
    window.location.href = 'https://github.com/apps/contextly-dev/installations/new';
  };

  return (
    <div className="installations-view">
      <div className="view-header">
        <div>
          <h1>GitHub App</h1>
          <p>Grant Contextly permission to access your repositories.</p>
        </div>
        <button className="btn-primary" onClick={handleInstall}>Install GitHub App</button>
      </div>

      {loading ? (
        <div className="loading">Loading installations...</div>
      ) : installations.length === 0 ? (
        <div className="empty-state">
          <h3>No installations found</h3>
          <p>Install the GitHub App to enable automated context syncing from PRs and Commits.</p>
        </div>
      ) : (
        <div className="installation-list">
          {installations.map((inst) => (
            <div key={inst.id} className="installation-card">
              <div className="inst-info">
                <h3>{inst.account_login}</h3>
                <span className="type-badge">{inst.target_type}</span>
              </div>
              <div className="inst-meta">
                <span>Repositories: {inst.repository_selection}</span>
                <span>ID: {inst.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }

        .btn-primary {
          background: #34FFB3;
          color: #0A0B0F;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .installation-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .installation-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .type-badge {
          font-size: 10px;
          background: rgba(52, 255, 179, 0.1);
          color: #34FFB3;
          padding: 2px 8px;
          border-radius: 99px;
          margin-top: 4px;
          display: inline-block;
        }

        .inst-meta {
          text-align: right;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 0;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
