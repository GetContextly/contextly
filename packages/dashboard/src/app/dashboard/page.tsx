'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { randomBytes } from 'crypto';

interface Project {
  id: string;
  name: string;
  github_repo_url: string | null;
  created_at: string;
  stats?: {
    decision_count: number;
    change_count: number;
    last_sync_at: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        stats:project_stats(decision_count, change_count, last_sync_at)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data.map((p: any) => ({
        ...p,
        stats: p.stats
      })));
    }
    setLoading(false);
  }

  async function handleCreateProject() {
    if (!newName.trim()) return;
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mcpToken = 'ctx_' + Array.from(randomBytes(32)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newName.trim(),
        mcp_token: mcpToken,
        owner_id: user.id,
        github_repo_url: newRepo.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setProjects(prev => [{ ...data, stats: undefined }, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewRepo('');
    }
    setCreating(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="heading-m text-white mb-2">Projects</h1>
          <p className="text-white/40 text-sm font-mono uppercase tracking-widest italic">Scaled Infrastructure</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-signal-green/50 hover:bg-signal-green/5 text-sm font-bold transition-all group"
        >
          <span className="text-signal-green group-hover:mr-2 transition-all">+</span> Create New Project
        </button>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-dark rounded-[2rem] p-10 border-white/10 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-display font-bold mb-2">Create New Project</h2>
              <p className="text-white/40 text-sm mb-8">Set up project memory for a new codebase.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="my-project"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-signal-green/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">GitHub Repository URL (optional)</label>
                  <input
                    type="url"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-signal-green/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !newName.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-signal-green text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark rounded-[2.5rem] p-20 text-center border-dashed border-2 border-white/5"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl opacity-20">📂</span>
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">No projects yet</h3>
          <p className="text-white/40 mb-10 max-w-sm mx-auto">
            Ready for scale. Initialize your project memory in seconds.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 rounded-2xl bg-signal-green text-black font-bold text-sm hover:scale-[1.02] transition-all"
          >
            Create Your First Project
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="group block glass-dark rounded-[2rem] p-8 border-white/5 hover:border-signal-green/30 transition-all hover:translate-y-[-4px]"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-signal-green/10 transition-colors">
                    <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">◈</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-signal-green shadow-[0_0_8px_#34FFB3]" />
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">Healthy</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/10">SYNCED {project.stats?.last_sync_at ? new Date(project.stats.last_sync_at).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-signal-green transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-white/30 font-mono truncate mb-6">
                  {project.github_repo_url?.split('/').pop() || 'No repository linked'}
                </p>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white">{project.stats?.decision_count || 0}</span>
                      <span className="text-[9px] font-mono text-white/20 uppercase">Decisions</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white">{project.stats?.change_count || 0}</span>
                      <span className="text-[9px] font-mono text-white/20 uppercase">Changes</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
