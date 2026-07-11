'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  github_repo_url: string | null;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    fetchProjects();
  }, []);

  return (
    <div className="projects-view">
      <div className="view-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your architectural memory hubs.</p>
        </div>
        <button className="btn-primary">New Project</button>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>Initialize a project using the Contextly CLI to see it here.</p>
          <code>npm install -g @contextly/cli && contextly init</code>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="project-card">
              <div className="project-info">
                <h3>{project.name}</h3>
                <span className="repo-badge">{project.github_repo_url || 'No repo linked'}</span>
              </div>
              <div className="project-meta">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                <div className="status-dot"></div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .projects-view {
          max-width: 1000px;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .view-header p {
          color: rgba(255, 255, 255, 0.4);
        }

        .btn-primary {
          background: #34FFB3;
          color: #0A0B0F;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
        }

        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .project-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          text-decoration: none;
          color: white;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 160px;
        }

        .project-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(52, 255, 179, 0.3);
          transform: translateY(-4px);
        }

        .project-info h3 {
          font-size: 18px;
          margin-bottom: 12px;
        }

        .repo-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.5);
        }

        .project-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #34FFB3;
          border-radius: 50%;
          box-shadow: 0 0 10px #34FFB3;
        }

        .empty-state {
          text-align: center;
          padding: 80px 0;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }

        .empty-state h3 {
          margin-bottom: 12px;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }

        code {
          background: black;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #34FFB3;
        }

        .loading {
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  );
}
