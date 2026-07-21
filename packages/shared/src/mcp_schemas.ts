import { z } from 'zod';

export const GetContextSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
});

export const ExplainFileSchema = z.object({
  path: z.string().min(1, "File path is required"),
});

export const RecentChangesSchema = z.object({
  since: z.string().min(1, "since is required — use ISO 8601 or shorthand like '1h', '7d'"),
});

export const LogDecisionSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  reasoning: z.string().min(1, "Reasoning is required"),
  related_files: z.array(z.string()).optional(),
});
