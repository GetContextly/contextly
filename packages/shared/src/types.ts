export type ProjectRole = 'owner' | 'member' | 'viewer';

export interface Project {
  id: string;
  name: string;
  githubRepoUrl?: string;
  ownerId: string;
  mcpToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  projectId: string;
  summary: string;
  reasoning?: string;
  source: 'git_commit' | 'pull_request' | 'agent_logged' | 'manual';
  relatedFiles: string[];
  createdAt: string;
}

export interface Change {
  id: string;
  projectId: string;
  summary: string;
  commitSha?: string;
  createdAt: string;
}
