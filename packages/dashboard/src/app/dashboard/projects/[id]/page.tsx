'use client';

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  mcp_token: string;
  github_repo_url: string | null;
}

interface Decision {
  id: string;
  summary: string;
  reasoning: string;
  created_at: string;
  related_files: string[];
  source: string;
}

interface Change {
  id: string;
  summary: string;
  commit_sha: string;
  created_at: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMcpConfig, setShowMcpConfig] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [projRes, decRes, changeRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('decisions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('changes').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(20)
      ]);

      if (projRes.data) setProject(projRes.data);
      if (decRes.data) setDecisions(decRes.data);
      if (changeRes.data) setChanges(changeRes.data);

      setLoading(false);
    }

    fetchData();
  }, [id]);

  const copyToken = () => {
    if (project?.mcp_token) {
      navigator.clipboard.writeText(project.mcp_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyMcpConfig = () => {
    const config = JSON.stringify({
      mcpToken: project?.mcp_token,
      projectId: project?.id,
    }, null, 2);
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-signal-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return <div className="text-white/40">Project not found.</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20 mb-8">
        <a href="/dashboard" className="hover:text-signal-green transition-colors">Projects</a>
        <span>/</span>
        <span className="text-white/60">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="heading-m text-white">{project.name}</h1>
            <span className="px-3 py-1 rounded-full bg-signal-green/10 text-signal-green text-[10px] font-mono uppercase tracking-widest border border-signal-green/20">
              Live Capture
            </span>
          </div>
          <p className="text-white/40 font-mono text-xs">{project.github_repo_url || 'No repository linked'}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-dark rounded-2xl p-1 pl-6 flex items-center gap-4 border-white/5">
             <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">MCP TOKEN</span>
             <code className="text-xs text-signal-green/70 font-mono truncate max-w-[120px]">
               {copied ? 'COPIED!' : project.mcp_token}
             </code>
             <button
               onClick={copyToken}
               className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60"
             >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                 <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
               </svg>
             </button>
          </div>
          <button
            onClick={() => setShowMcpConfig(!showMcpConfig)}
            className="px-6 py-3 rounded-xl bg-signal-green text-black font-bold text-sm shadow-[0_0_20px_rgba(52,255,179,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            Configure Agent
          </button>
        </div>
      </div>

      {/* MCP Config Panel */}
      <AnimatePresence>
        {showMcpConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="glass-dark rounded-[2rem] p-8 border-signal-green/20 bg-signal-green/[0.02]">
              <h3 className="text-lg font-bold text-signal-green mb-4">MCP Configuration</h3>
              <p className="text-sm text-white/40 mb-6">
                Add this to your MCP client config (e.g. Claude Desktop, Cursor, OpenCode):
              </p>
              <div className="bg-black rounded-xl p-4 font-mono text-xs text-signal-green/80 overflow-x-auto">
                <pre>{JSON.stringify({
                  mcpServers: {
                    contextly: {
                      command: "npx",
                      args: ["-y", "@contextly/mcp-server"],
                      env: {
                        CONTEXTLY_TOKEN: project.mcp_token,
                        SUPABASE_URL: "your-supabase-url",
                        SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key"
                      }
                    }
                  }
                }, null, 2)}</pre>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copyMcpConfig}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  {copied ? 'Copied!' : 'Copy Config'}
                </button>
                <a
                  href="https://github.com/GetContextly/contextly#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  View Docs
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total Decisions', value: decisions.length, icon: '🧠' },
          { label: 'Git Syncs', value: changes.length, icon: '🔄' },
          { label: 'Contributors', value: '1', icon: '👤' },
          { label: 'Memory Health', value: '98%', icon: '💎' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-dark rounded-3xl p-8 border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-2">{stat.label}</p>
            <p className="text-3xl font-display font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Decisions List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">Architectural Memory</h2>
          </div>

          <div className="space-y-4">
            {decisions.length === 0 ? (
               <div className="p-12 text-center glass-dark rounded-[2rem] border-white/5 border-dashed border-2">
                 <p className="text-white/20 font-mono text-sm">No architectural decisions identified yet.</p>
                 <p className="text-white/20 font-mono text-xs mt-2">Run "contextly sync" to ingest git history.</p>
               </div>
            ) : (
              decisions.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.05) }}
                  className="glass-dark rounded-[2rem] p-8 border-white/5 hover:border-signal-green/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                       <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">
                         {d.source === 'git_commit' ? '⚡' : d.source === 'pull_request' ? '🔀' : d.source === 'agent_logged' ? '🤖' : '✍'}
                       </span>
                       <h3 className="text-lg font-bold group-hover:text-signal-green transition-colors">{d.summary}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-white/20 uppercase">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed mb-8 line-clamp-3">
                    {d.reasoning}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {d.related_files?.slice(0, 4).map(file => (
                      <span key={file} className="px-2 py-1 rounded bg-white/5 text-[9px] font-mono text-white/30 border border-white/5">
                        {file.split('/').pop()}
                      </span>
                    ))}
                    {d.related_files?.length > 4 && (
                       <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-mono text-white/30">
                         +{d.related_files.length - 4} more
                       </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-8">
           <h2 className="text-xl font-display font-bold">Recent Syncs</h2>
           <div className="glass-dark rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden">
             <div className="absolute left-[47px] top-12 bottom-12 w-px bg-white/5" />

             <div className="space-y-10 relative">
               {changes.length === 0 ? (
                 <p className="text-white/20 font-mono text-sm text-center py-8">No syncs yet.</p>
               ) : (
                 changes.map((c, i) => (
                   <div key={c.id} className="flex gap-6 items-start">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 z-10">
                       <span className="text-xs">◈</span>
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs font-bold text-white/80 truncate mb-1">{c.summary}</p>
                       <div className="flex items-center gap-3">
                         <span className="text-[9px] font-mono text-signal-green/40">{c.commit_sha?.substring(0, 7)}</span>
                         <span className="text-[9px] font-mono text-white/20">{new Date(c.created_at).toLocaleDateString()}</span>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-16 pt-10 border-t border-red-500/10">
        <div className="glass-dark rounded-[2rem] p-8 border-red-500/10 bg-red-500/[0.02]">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold mb-1 text-red-500/80">Delete Project</h4>
              <p className="text-xs text-white/30">Permanently remove this project and all its data. This cannot be undone.</p>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                Delete Project
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-500">Are you sure?</span>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    await supabase.from('projects').delete().eq('id', id);
                    router.push('/dashboard');
                  }}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
