import { z } from 'zod';

export const LogDecisionSchema = z.object({
  summary: z.string().min(1).max(255),
  reasoning: z.string().optional(),
  relatedFiles: z.array(z.string()).optional(),
});

export const ProjectConfigSchema = z.object({
  projectId: z.string().uuid().nullable(),
  name: z.string(),
  updatedAt: z.string().datetime(),
});

export const MCPConfigSchema = z.object({
  mcpToken: z.string(),
  projectId: z.string().uuid(),
});
