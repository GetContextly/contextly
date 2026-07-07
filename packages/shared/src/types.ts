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

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
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

// MCP Tool Types
export interface GetContextArgs {
  topic?: string;
}

export interface ExplainFileArgs {
  path: string;
}

export interface RecentChangesArgs {
  since?: string; // ISO date string
}

export interface LogDecisionArgs {
  summary: string;
  reasoning?: string;
  relatedFiles?: string[];
}
