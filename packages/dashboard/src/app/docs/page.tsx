import React from 'react';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { name: 'Installation', href: '#installation', description: 'Install the CLI and initialize your project' },
      { name: 'Quick Start', href: '#quick-start', description: 'Go from zero to synced in 3 commands' },
      { name: 'Configuration', href: '#configuration', description: 'Set up your MCP client for any AI agent' },
    ],
  },
  {
    title: 'CLI Commands',
    items: [
      { name: 'contextly login', href: '#login', description: 'Authenticate with GitHub via Device Flow' },
      { name: 'contextly init', href: '#init', description: 'Initialize Contextly in your project directory' },
      { name: 'contextly sync', href: '#sync', description: 'Sync git history into project memory' },
      { name: 'contextly log', href: '#log', description: 'Log an architectural decision manually' },
      { name: 'contextly status', href: '#status', description: 'View project memory status' },
    ],
  },
  {
    title: 'MCP Tools',
    items: [
      { name: 'get_context', href: '#get-context', description: 'Query project memory by topic' },
      { name: 'explain_file', href: '#explain-file', description: 'Get context about a specific file' },
      { name: 'recent_changes', href: '#recent-changes', description: 'See what changed in a time window' },
      { name: 'log_decision', href: '#log-decision', description: 'Record a decision for future agents' },
      { name: 'get_project_brief', href: '#get-project-brief', description: 'Compressed project overview for cold-start' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { name: 'Claude Desktop', href: '#claude-desktop', description: 'Connect via MCP configuration' },
      { name: 'Cursor', href: '#cursor', description: 'Add project memory to Cursor' },
      { name: 'GitHub App', href: '#github-app', description: 'Auto-sync via GitHub webhooks' },
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="bg-[#06070a] min-h-screen text-white pt-32 pb-20">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <h1 className="heading-l mb-4">Documentation</h1>
          <p className="text-white/40 text-lg">
            Everything you need to set up and use Contextly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-signal-green mb-6">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block group"
                  >
                    <p className="text-sm font-bold text-white/70 group-hover:text-signal-green transition-colors">
                      {item.name}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Section */}
        <section id="installation" className="mb-20">
          <h2 className="text-2xl font-display font-bold mb-8">Installation</h2>
          <div className="glass-dark rounded-[2rem] p-8 border-white/5">
            <code className="block bg-black rounded-xl p-6 font-mono text-sm text-signal-green/80 whitespace-pre-wrap">
{`# Install the CLI globally
npm install -g @contextly/cli

# Authenticate with GitHub
contextly login

# Initialize in your project
cd your-project
contextly init

# Sync git history
contextly sync`}
            </code>
          </div>
        </section>

        {/* MCP Configuration */}
        <section id="configuration" className="mb-20">
          <h2 className="text-2xl font-display font-bold mb-8">MCP Client Configuration</h2>
          <div className="glass-dark rounded-[2rem] p-8 border-white/5">
            <p className="text-white/40 text-sm mb-6">
              After running <code className="text-signal-green">contextly init</code>, you&apos;ll have a <code className="text-signal-green">.contextly/mcp.json</code> file.
              Add the following to your MCP client config:
            </p>
            <code className="block bg-black rounded-xl p-6 font-mono text-xs text-signal-green/80 whitespace-pre-wrap">
{`{
  "mcpServers": {
    "contextly": {
      "command": "npx",
      "args": ["-y", "@contextly/mcp-server"],
      "env": {
        "CONTEXTLY_TOKEN": "from .contextly/mcp.json",
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}`}
            </code>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="https://github.com/GetContextly/contextly"
            className="text-signal-green text-sm hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View full source on GitHub
          </Link>
        </div>
      </div>

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
