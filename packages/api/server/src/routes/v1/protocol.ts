import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { asyncHandler, errors } from '../middleware/error';
import { requirePermission, requireScopeAccess } from '../middleware/auth';
import { usageMetering, trackTokensUsed } from '../middleware/rate-limit';
import { contextStore } from '../store/context-store';
import { APIError } from '../middleware/error';
import { AuthenticatedRequest, ReadContextRequest, CommitRequest, QueryRequest, ResolveRequest, ForkRequest, MergeRequest } from '../types';

const router = Router();

// Apply common middleware
router.use(usageMetering);
router.use(trackTokensUsed);

// Validation schemas
const readContextSchema = z.object({
  scope: z.string().min(1),
  budget: z.number().int().positive().max(100000).optional(),
  kind: z.enum(['decision', 'rule', 'observation']).optional(),
  cid: z.string().optional(),
  task: z.string().optional(),
});

const commitSchema = z.object({
  scope: z.string().min(1),
  cid: z.string().min(1),
  message: z.string().min(1).max(5000),
  kind: z.enum(['decision', 'rule', 'observation']),
  supersedes: z.string().optional(),
  parents: z.array(z.string()).optional(),
});

const querySchema = z.object({
  scope: z.string().optional(),
  id: z.string().optional(),
  cid: z.string().optional(),
  kind: z.enum(['decision', 'rule', 'observation']).optional(),
  status: z.enum(['active', 'superseded', 'archived', 'tombstoned']).optional(),
});

const resolveSchema = z.object({
  scope: z.string().min(1),
  cid: z.string().min(1),
  message: z.string().min(1).max(5000),
  kind: z.enum(['decision', 'rule', 'observation']),
  supersedingId: z.string().min(1),
});

const forkSchema = z.object({
  scope: z.string().min(1),
  parentScope: z.string().min(1),
});

const mergeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
});

/**
 * POST /v1/read_context
 * Read compiled context for a scope
 */
router.post('/read_context', 
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = readContextSchema.parse(req.body);
    
    const result = await contextStore.readContext({
      scope: input.scope,
      budget: input.budget,
      kind: input.kind,
      cid: input.cid,
      task: input.task,
    });
    
    // Track token usage for metering
    (res as any).tokensUsed = result.stats.tokenCount;
    
    res.json(result);
  })
);

/**
 * POST /v1/commit
 * Create a new context entry
 */
router.post('/commit',
  requirePermission('entries', 'write'),
  requireScopeAccess('scope'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = commitSchema.parse(req.body);
    
    // Verify scope access
    const authReq = req as AuthenticatedRequest;
    if (!authReq.apiKey && !authReq.user) {
      throw errors.unauthorized();
    }
    
    const result = await contextStore.commit({
      scope: input.scope,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      author: authReq.user?.email || authReq.apiKey?.name || 'api',
      supersedes: input.supersedes,
      parents: input.parents,
    });
    
    if (result.status === 'conflict') {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Conflict detected with existing entry',
          details: result.conflict,
        },
      });
    }
    
    if (result.status === 'already_exists') {
      return res.status(409).json({
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Identical entry already exists',
          details: { existingId: result.entry?.id },
        },
      });
    }
    
    (res as any).tokensUsed = 1; // Minimal token cost for writes
    
    res.status(201).json(result);
  })
);

/**
 * POST /v1/query
 * Query entries by filters
 */
router.post('/query',
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = querySchema.parse(req.body);
    
    const result = await contextStore.query({
      scope: input.scope,
      id: input.id,
      cid: input.cid,
      kind: input.kind,
      status: input.status,
    });
    
    (res as any).tokensUsed = result.entries.length;
    
    res.json(result);
  })
);

/**
 * POST /v1/resolve
 * Resolve a conflict by superseding an entry
 */
router.post('/resolve',
  requirePermission('conflicts', 'resolve'),
  requireScopeAccess('scope'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = resolveSchema.parse(req.body);
    
    const authReq = req as AuthenticatedRequest;
    
    const result = await contextStore.resolve({
      scope: input.scope,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      author: authReq.user?.email || authReq.apiKey?.name || 'api',
      supersedingId: input.supersedingId,
    });
    
    if (result.status === 'conflict_persists') {
      return res.status(409).json({
        error: {
          code: 'CONFLICT_PERSISTS',
          message: 'Resolution did not resolve conflict',
        },
      });
    }
    
    (res as any).tokensUsed = 1;
    
    res.json(result);
  })
);

/**
 * POST /v1/fork
 * Create a new scope forked from parent
 */
router.post('/fork',
  requirePermission('scopes', 'write'),
  requireScopeAccess('parentScope'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = forkSchema.parse(req.body);
    
    const authReq = req as AuthenticatedRequest;
    
    const result = await contextStore.fork({
      scope: input.scope,
      parentScope: input.parentScope,
      author: authReq.user?.email || authReq.apiKey?.name || 'api',
    });
    
    (res as any).tokensUsed = result.inheritedEntries;
    
    res.status(201).json(result);
  })
);

/**
 * POST /v1/merge
 * Merge source scope into target
 */
router.post('/merge',
  requirePermission('scopes', 'write'),
  requireScopeAccess('target'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = mergeSchema.parse(req.body);
    
    const authReq = req as AuthenticatedRequest;
    
    // Also check access to source scope
    if (!authReq.apiKey?.scopes.some(s => matchScope(s, input.source))) {
      throw errors.forbidden(`No access to source scope: ${input.source}`);
    }
    
    const result = await contextStore.merge({
      source: input.source,
      target: input.target,
      author: authReq.user?.email || authReq.apiKey?.name || 'api',
    });
    
    (res as any).tokensUsed = result.adopted;
    
    res.json(result);
  })
);

/**
 * GET /v1/scopes/:scope/history
 * Get history of a scope
 */
router.get('/scopes/:scope/history',
  requirePermission('entries', 'read'),
  requireScopeAccess('scope'),
  asyncHandler(async (req: Request, res: Response) => {
    const { scope } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const history = await contextStore.getScopeHistory(scope, limit, offset);
    res.json({ scope, history, limit, offset });
  })
);

/**
 * GET /v1/entries/:id
 * Get a specific entry by ID
 */
router.get('/entries/:id',
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const entry = await contextStore.getEntry(id);
    if (!entry) {
      throw errors.notFound('Entry', id);
    }
    
    // Check scope access
    const authReq = req as AuthenticatedRequest;
    if (authReq.apiKey && !authReq.apiKey.scopes.some(s => matchScope(s, entry.scope))) {
      throw errors.forbidden('No access to this entry\'s scope');
    }
    
    (res as any).tokensUsed = 1;
    res.json(entry);
  })
);

/**
 * GET /v1/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Helper function for scope matching
function matchScope(granted: string, required: string): boolean {
  if (granted === required) return true;
  if (granted.endsWith('.*')) {
    const prefix = granted.slice(0, -2);
    return required.startsWith(prefix);
  }
  return false;
}

export default router;