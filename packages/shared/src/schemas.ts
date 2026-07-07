import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  githubRepoUrl: z.string().url().optional(),
  ownerId: z.string().uuid(),
  mcpToken: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const DecisionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  summary: z.string().min(1),
  reasoning: z.string().optional(),
  source: z.enum(['git_commit', 'pull_request', 'agent_logged', 'manual']),
  relatedFiles: z.array(z.string()),
  createdAt: z.string().datetime(),
});
