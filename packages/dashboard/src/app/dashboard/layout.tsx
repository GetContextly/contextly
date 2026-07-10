import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <nav className="dashboard-sidebar">
        <div className="sidebar-header">
          <Link href="/" className="logo">Contextly</Link>
        </div>
        <div className="sidebar-links">
          <Link href="/dashboard" className="sidebar-link active">Projects</Link>
          <Link href="/dashboard/installations" className="sidebar-link">GitHub App</Link>
          <Link href="/dashboard/settings" className="sidebar-link">Settings</Link>
        </div>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">U</div>
            <span>User</span>
          </div>
        </div>
      </nav>
      <main className="dashboard-content">
        {children}
      </main>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          height: 100vh;
          background: #0A0B0F;
          color: white;
        }

        .dashboard-sidebar {
          width: 260px;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          padding: 24px;
        }

        .sidebar-header {
          margin-bottom: 40px;
        }

        .logo {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }

        .sidebar-links {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-link {
          padding: 12px 16px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: all 0.2s;
          font-size: 14px;
        }

        .sidebar-link:hover, .sidebar-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-link.active {
          border: 1px solid rgba(52, 255, 179, 0.2);
          color: #34FFB3;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #34FFB3;
          color: #0A0B0F;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
