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
  reasoning: string;
  source: 'git_commit' | 'pull_request' | 'agent_logged' | 'manual';
  relatedFiles: string[];
  createdAt: string;
}

export interface Change {
  id: string;
  projectId: string;
  summary: string;
  commitSha: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

// MCP Tool Input Types — match API_CONTRACTS.md exactly
export interface GetContextArgs {
  topic: string;
}

export interface ExplainFileArgs {
  path: string;
}

export interface RecentChangesArgs {
  since: string;
}

export interface LogDecisionArgs {
  summary: string;
  reasoning: string;
  relatedFiles?: string[];
}

// MCP Tool Output Types — match API_CONTRACTS.md exactly
export interface GetContextOutput {
  summary: string;
  related_decisions: Decision[];
  last_updated: string;
}

export interface ExplainFileOutput {
  summary: string;
  related_decisions: Decision[];
  file_exists_in_repo: boolean;
}

export interface RecentChangesOutput {
  changes: Change[];
  decisions: Decision[];
}

export interface LogDecisionOutput {
  id: string;
  created_at: string;
}
