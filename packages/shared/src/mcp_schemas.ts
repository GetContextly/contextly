import { z } from 'zod';

export const GetContextSchema = z.object({
  topic: z.string().optional(),
});

export const ExplainFileSchema = z.object({
  path: z.string(),
});

export const RecentChangesSchema = z.object({
  since: z.string().optional(),
});

export const LogDecisionToolSchema = z.object({
  summary: z.string(),
  reasoning: z.string().optional(),
  relatedFiles: z.array(z.string()).optional(),
});
