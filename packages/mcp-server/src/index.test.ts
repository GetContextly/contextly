import { describe, it, expect } from 'vitest';

describe('MCP Server Tool Contracts', () => {
  describe('parseSince (used by recent_changes)', () => {
    it('should parse relative shorthands', async () => {
      const { parseSince } = await import('@contextly/shared/src/date_utils');
      const result = parseSince('1h');
      expect(new Date(result).getTime()).not.toBeNaN();
    });

    it('should accept ISO strings', async () => {
      const { parseSince } = await import('@contextly/shared/src/date_utils');
      const iso = '2026-01-01T00:00:00.000Z';
      expect(parseSince(iso)).toBe(iso);
    });

    it('should reject invalid formats', async () => {
      const { parseSince } = await import('@contextly/shared/src/date_utils');
      expect(() => parseSince('bad')).toThrow();
      expect(() => parseSince('')).toThrow();
    });
  });

  describe('Tool input validation schemas', () => {
    it('get_context requires topic', async () => {
      const { GetContextSchema } = await import('@contextly/shared/src/mcp_schemas');
      expect(() => GetContextSchema.parse({})).toThrow();
      expect(() => GetContextSchema.parse({ topic: '' })).toThrow();
      expect(GetContextSchema.parse({ topic: 'auth' })).toEqual({ topic: 'auth' });
    });

    it('explain_file requires path', async () => {
      const { ExplainFileSchema } = await import('@contextly/shared/src/mcp_schemas');
      expect(() => ExplainFileSchema.parse({})).toThrow();
      expect(ExplainFileSchema.parse({ path: 'src/index.ts' })).toEqual({ path: 'src/index.ts' });
    });

    it('recent_changes requires since', async () => {
      const { RecentChangesSchema } = await import('@contextly/shared/src/mcp_schemas');
      expect(() => RecentChangesSchema.parse({})).toThrow();
      expect(RecentChangesSchema.parse({ since: '1d' })).toEqual({ since: '1d' });
    });

    it('log_decision requires summary and reasoning', async () => {
      const { LogDecisionSchema } = await import('@contextly/shared/src/mcp_schemas');
      expect(() => LogDecisionSchema.parse({})).toThrow();
      expect(() => LogDecisionSchema.parse({ summary: 'test' })).toThrow();
      expect(() => LogDecisionSchema.parse({ reasoning: 'because' })).toThrow();
      expect(
        LogDecisionSchema.parse({ summary: 'test', reasoning: 'because' })
      ).toEqual({ summary: 'test', reasoning: 'because' });
    });

    it('log_decision allows optional related_files', async () => {
      const { LogDecisionSchema } = await import('@contextly/shared/src/mcp_schemas');
      const result = LogDecisionSchema.parse({
        summary: 'Switched to Postgres',
        reasoning: 'Need relational queries',
        related_files: ['schema.sql', 'migrations/001.sql'],
      });
      expect(result.related_files).toHaveLength(2);
    });
  });

  describe('createMcpResponse', () => {
    it('should wrap text in MCP response format', async () => {
      const { createMcpResponse } = await import('@contextly/shared/src/mcp_helpers');
      const response = createMcpResponse('hello');
      expect(response).toEqual({
        content: [{ type: 'text', text: 'hello' }],
      });
    });
  });
});
