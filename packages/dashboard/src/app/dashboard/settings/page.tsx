'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="settings-view">
      <h1>Settings</h1>

      <section className="settings-section">
        <h3>Account</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="info">
              <span className="label">GitHub Connection</span>
              <span className="desc">Your account is linked to GitHub.</span>
            </div>
            <button className="btn-secondary">Reconnect</button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>API & Tokens</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="info">
              <span className="label">Default MCP Token</span>
              <span className="desc">Use this to connect agents to your global context.</span>
            </div>
            <code>ctx_global_xxxxxxxxxxxxxxxx</code>
          </div>
        </div>
      </section>

      <style jsx>{`
        h1 {
          font-size: 32px;
          margin-bottom: 40px;
        }

        .settings-section {
          margin-bottom: 48px;
        }

        h3 {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .settings-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .setting-item {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-weight: 600;
          font-size: 16px;
        }

        .desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        code {
          background: black;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #34FFB3;
        }
      `}</style>
    </div>
  );
}
