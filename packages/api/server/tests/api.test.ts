import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { app } from '../src/index.js';
import { contextStore } from '../src/store/context-store.js';

const TEST_SCOPE = 'project.test';
const TEST_CID = 'test.decision';

describe('Contextly API', () => {
  beforeAll(() => {
    // Clear any existing test data
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await app.request('/health');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('1.0.0');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: TEST_SCOPE }),
      });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should accept valid API key', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE }),
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /v1/read_context', () => {
    it('should read compiled context for a scope', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE, budget: 5000 }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('conflicts');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('dropped');
      expect(data).toHaveProperty('logs');
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should filter by kind', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE, kind: 'decision' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      for (const entry of data.entries) {
        expect(entry.kind).toBe('decision');
      }
    });

    it('should respect token budget', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE, budget: 100 }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stats.tokenCount).toBeLessThanOrEqual(100);
    });
  });

  describe('POST /v1/commit', () => {
    it('should create a new context entry', async () => {
      const response = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.new-entry',
          message: 'New test decision',
          kind: 'decision',
        }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.status).toBe('committed');
      expect(data.entry.cid).toBe('test.new-entry');
      expect(data.entry.message).toBe('New test decision');
    });

    it('should reject duplicate entries', async () => {
      // First commit
      await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.duplicate',
          message: 'Duplicate test',
          kind: 'decision',
        }),
      });

      // Second commit with same content
      const response = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.duplicate',
          message: 'Duplicate test',
          kind: 'decision',
        }),
      });
      
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error.code).toBe('ALREADY_EXISTS');
    });

    it('should detect conflicts', async () => {
      // First commit
      const first = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.conflict',
          message: 'First message',
          kind: 'decision',
        }),
      });
      expect(first.status).toBe(201);

      // Second commit with same CID but different message
      const response = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.conflict',
          message: 'Second message',
          kind: 'decision',
        }),
      });
      
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.conflict).toBeDefined();
      expect(data.conflict.cid).toBe('test.conflict');
    });

    it('should validate required fields', async () => {
      const response = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('POST /v1/query', () => {
    it('should query entries by CID', async () => {
      const response = await app.request('/v1/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.new-entry',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should filter by kind', async () => {
      const response = await app.request('/v1/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          kind: 'decision',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      for (const entry of data.entries) {
        expect(entry.kind).toBe('decision');
      }
    });
  });

  describe('POST /v1/resolve', () => {
    it('should resolve a conflict', async () => {
      // First create a conflict
      await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.resolve',
          message: 'First version',
          kind: 'decision',
        }),
      });
      
      const second = await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.resolve',
          message: 'Second version',
          kind: 'decision',
        }),
      });
      expect(second.status).toBe(409);
      const conflictData = await second.json();
      
      // Now resolve by superseding the second entry
      const resolveResponse = await app.request('/v1/resolve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: TEST_SCOPE,
          cid: 'test.resolve',
          message: 'Resolved version',
          kind: 'decision',
          supersedingId: conflictData.entry.id,
        }),
      });
      
      expect(resolveResponse.status).toBe(200);
      const resolveData = await resolveResponse.json();
      expect(resolveData.status).toBe('resolved');
      expect(resolveData.supersededId).toBeDefined();
    });
  });

  describe('POST /v1/fork', () => {
    it('should fork a scope', async () => {
      const response = await app.request('/v1/fork', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: 'feature.test-fork',
          parentScope: TEST_SCOPE,
        }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('forked');
      expect(data.scope).toBe('feature.test-fork');
      expect(data.parentScope).toBe(TEST_SCOPE);
      expect(typeof data.inheritedEntries).toBe('number');
    });
  });

  describe('POST /v1/merge', () => {
    it('should merge a fork back', async () => {
      // First create a fork
      const forkResponse = await app.request('/v1/fork', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: 'feature.merge-test',
          parentScope: TEST_SCOPE,
        }),
      });
      expect(forkResponse.status).toBe(201);

      // Add something to the fork
      await app.request('/v1/commit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          scope: 'feature.merge-test',
          cid: 'test.merged',
          message: 'Merged feature',
          kind: 'decision',
        }),
      });

      // Now merge back
      const response = await app.request('/v1/merge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          source: 'feature.merge-test',
          target: TEST_SCOPE,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('merged');
      expect(data.adopted).toBeGreaterThan(0);
    });
  });

  describe('Webhook Management', () => {
    it('should create a webhook subscription', async () => {
      const response = await app.request('/v1/webhooks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({
          url: 'https://example.com/webhook',
          events: ['context.created', 'conflict.detected'],
          auth: { secret: 'test-secret', headers: {} },
          retryConfig: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2 },
          idempotencyWindowMs: 3600000,
        }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.url).toBe('https://example.com/webhook');
      expect(data.events).toContain('context.created');
    });

    it('should list webhook subscriptions', async () => {
      const response = await app.request('/v1/webhooks', {
        method: 'GET',
        headers: { 'X-API-Key': 'ctx_d3m0k3y12345678901234567890' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscriptions).toBeDefined();
      expect(Array.isArray(data.subscriptions)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await app.request('/v1/read_context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'ctx_d3m0k3y12345678901234567890',
        },
        body: JSON.stringify({ scope: TEST_SCOPE }),
      });
      
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('OpenAPI Spec', () => {
    it('should serve OpenAPI spec', async () => {
      const response = await app.request('/openapi.json');
      expect(response.status).toBe(200);
      
      const spec = await response.json();
      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('Contextly API');
      expect(spec.paths['/v1/read_context']).toBeDefined();
      expect(spec.paths['/v1/commit']).toBeDefined();
    });
  });

  describe('Swagger UI', () => {
    it('should serve Swagger UI', async () => {
      const response = await app.request('/docs');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });
});