import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before importing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'test-project-id' }, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ErrorCode: { InvalidRequest: 'InvalidRequest', InternalError: 'InternalError', MethodNotFound: 'MethodNotFound' },
  McpError: class McpError extends Error {
    constructor(public code: string, message: string) {
      super(message);
      this.name = 'McpError';
    }
  },
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

// Set required env vars
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.CONTEXTLY_TOKEN = 'ctx_test-token-123';

import { parseSince } from '@contextly/shared';

describe('MCP Server Tool Contracts', () => {
  describe('parseSince (used by recent_changes)', () => {
    it('should parse relative shorthands', () => {
      const result = parseSince('1h');
      expect(new Date(result).getTime()).not.toBeNaN();
    });

    it('should accept ISO strings', () => {
      const iso = '2026-01-01T00:00:00.000Z';
      expect(parseSince(iso)).toBe(iso);
    });
  });

  describe('Tool input validation schemas', () => {
    it('get_context requires topic', async () => {
      const { GetContextSchema } = await import('@contextly/shared');
      expect(() => GetContextSchema.parse({})).toThrow();
      expect(() => GetContextSchema.parse({ topic: '' })).toThrow();
      expect(GetContextSchema.parse({ topic: 'auth' })).toEqual({ topic: 'auth' });
    });

    it('explain_file requires path', async () => {
      const { ExplainFileSchema } = await import('@contextly/shared');
      expect(() => ExplainFileSchema.parse({})).toThrow();
      expect(ExplainFileSchema.parse({ path: 'src/index.ts' })).toEqual({ path: 'src/index.ts' });
    });

    it('recent_changes requires since', async () => {
      const { RecentChangesSchema } = await import('@contextly/shared');
      expect(() => RecentChangesSchema.parse({})).toThrow();
      expect(RecentChangesSchema.parse({ since: '1d' })).toEqual({ since: '1d' });
    });

    it('log_decision requires summary and reasoning', async () => {
      const { LogDecisionSchema } = await import('@contextly/shared');
      expect(() => LogDecisionSchema.parse({})).toThrow();
      expect(() => LogDecisionSchema.parse({ summary: 'test' })).toThrow();
      expect(() => LogDecisionSchema.parse({ reasoning: 'because' })).toThrow();
      expect(
        LogDecisionSchema.parse({ summary: 'test', reasoning: 'because' })
      ).toEqual({ summary: 'test', reasoning: 'because' });
    });

    it('log_decision allows optional related_files', async () => {
      const { LogDecisionSchema } = await import('@contextly/shared');
      const result = LogDecisionSchema.parse({
        summary: 'Switched to Postgres',
        reasoning: 'Need relational queries',
        related_files: ['schema.sql', 'migrations/001.sql'],
      });
      expect(result.related_files).toHaveLength(2);
    });
  });
});
