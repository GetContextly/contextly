import { z } from 'zod';

export const ProjectConfigSchema = z.object({
  projectId: z.string().uuid().nullable(),
  name: z.string(),
  updatedAt: z.string().datetime(),
});

export const MCPConfigSchema = z.object({
  mcpToken: z.string(),
  projectId: z.string().uuid(),
});
