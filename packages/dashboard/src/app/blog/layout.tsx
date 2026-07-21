import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Contextly',
  description: 'Engineering insights on AI context, persistent memory, and developer productivity.',
  openGraph: {
    title: 'Blog — Contextly',
    description: 'Engineering insights on AI context, persistent memory, and developer productivity.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
