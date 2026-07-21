import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Contextly',
  description: 'Set up Contextly, connect your AI agents, and query project memory via MCP.',
  openGraph: {
    title: 'Documentation — Contextly',
    description: 'Set up Contextly, connect your AI agents, and query project memory via MCP.',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
