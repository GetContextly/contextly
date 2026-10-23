import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { 
  requireScopeAccess, 
  requirePermission 
} from '../middleware/auth.js';
import { 
  ReadContextRequest, 
  ReadContextResponse,
  CommitRequest, 
  CommitResponse,
  QueryRequest, 
  QueryResponse,
  ResolveRequest, 
  ResolveResponse,
  ForkRequest, 
  ForkResponse,
  MergeRequest, 
  MergeResponse,
  APIError
} from '../types.js';
import { 
  contextStore,
  detectConflicts,
  applyBudget,
  calculateStats,
  logAudit 
} from '../store/context-store.js';

const router = Router();

// ============================================
// POST /v1/read_context - Read compiled context
// ============================================
router.post(
  '/read_context',
  requireScopeAccess('scope'),
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ReadContextRequest;
    
    // Validate required fields
    if (!input.scope) {
      throw new APIError('BAD_REQUEST', 'Scope is required', 400, { field: 'scope' });
    }
    
    // Check if scope exists
    const scopeExists = await contextStore.getActiveEntries(input.scope).then(entries => entries.length > 0);
    if (!scopeExists && !input.task) {
      throw new APIError('NOT_FOUND', `Scope not found: ${input.scope}`, 404);
    }
    
    // Get all active entries (including inherited)
    const entries = await contextStore.getActiveEntries(input.scope);
    
    // Filter by kind/cid if specified
    let filtered = entries;
    if (input.kind) {
      filtered = filtered.filter(e => e.kind === input.kind);
    }
    if (input.cid) {
      filtered = filtered.filter(e => e.cid === input.cid);
    }
    
    // Detect conflicts
    const conflicts = detectConflicts(input.scope);
    
    // Apply token budget
    const budget = input.budget || 8000;
    const budgetedEntries = applyBudget(filtered, budget);
    
    // Calculate stats
    const stats = calculateStats(budgetedEntries, conflicts);
    stats.budget = budget;
    
    // Determine dropped entries
    const dropped = filtered
      .filter(e => !budgetedEntries.some(be => be.id === e.id))
      .map(e => ({
        cid: e.cid,
        kind: e.kind,
        message: e.message,
        sourceScope: e.scope,
        reason: 'budget' as const,
      }));
    
    // Build response
    const response: ReadContextResponse = {
      entries: budgetedEntries.map(e => ({
        ...e,
        provenance: {
          sourceScope: e.scope,
          inherited: e.scope !== input.scope,
          fromParent: e.scope !== input.scope ? e.scope : null,
          supersedesChain: e.supersedes ? [e.supersedes] : [],
        },
      })),
      conflicts,
      stats,
      dropped,
      logs: [], // Audit logs could be added here
    };
    
    res.json(response);
  })
);

// ============================================
// POST /v1/commit - Create new commitment
// ============================================
router.post(
  '/commit',
  requireScopeAccess('scope'),
  requirePermission('entries', 'write'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CommitRequest;
    
    // Validate required fields
    if (!input.scope || !input.cid || !input.message || !input.kind) {
      throw new APIError('BAD_REQUEST', 'Missing required fields', 400, {
        required: ['scope', 'cid', 'message', 'kind'],
      });
    }
    
    // Validate kind
    if (!['decision', 'rule', 'observation'].includes(input.kind)) {
      throw new APIError('BAD_REQUEST', 'Invalid kind', 400, { 
        field: 'kind', 
        valid: ['decision', 'rule', 'observation'] 
      });
    }
    
    // Create entry
    const entry = await contextStore.insert({
      scope: input.scope,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      author: (req as any).user?.email || (req as any).apiKey?.name || 'api-user',
      supersedes: input.supersedes,
      parents: input.parents || [],
    });
    
    // Check for conflicts
    const conflicts = detectConflicts(input.scope);
    const conflict = conflicts.find(c => c.cid === input.cid);
    
    // Log audit event
    logAudit({
      id: `audit_${Date.now()}_commit`,
      type: conflict ? 'conflict_detected' : 'insert',
      scope: input.scope,
      entryId: entry.id,
      author: entry.author,
      timestamp: new Date().toISOString(),
      metadata: { cid: input.cid, kind: input.kind },
    });
    
    if (conflict) {
      res.status(409).json({
        id: entry.id,
        status: 'conflict',
        conflict: {
          cid: conflict.cid,
          existingMessage: conflict.existingEntry.message,
          existingId: conflict.existingEntry.id,
          incomingMessage: conflict.incomingEntry.message,
          incomingId: conflict.incomingEntry.id,
        },
      } as any);
    } else {
      res.status(201).json({
        id: entry.id,
        status: 'committed',
        entry,
      } as any);
    }
  })
);

// ============================================
// POST /v1/query - Query entries
// ============================================
router.post(
  '/query',
  requireScopeAccess('scope'),
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as QueryRequest;
    
    // Build scope filter
    const scopes = input.scope ? [input.scope] : Array.from(contextStore['scopes'].keys());
    
    let allEntries: any[] = [];
    for (const scope of scopes) {
      const entries = await contextStore.getActiveEntries(scope);
      allEntries.push(...entries.map(e => ({ ...e, scope })));
    }
    
    // Apply filters
    let filtered = allEntries;
    if (input.id) {
      filtered = filtered.filter(e => e.id === input.id);
    }
    if (input.cid) {
      filtered = filtered.filter(e => e.cid === input.cid);
    }
    if (input.kind) {
      filtered = filtered.filter(e => e.kind === input.kind);
    }
    if (input.status) {
      filtered = filtered.filter(e => e.status === input.status);
    }
    
    res.json({ entries: filtered } as any);
  })
);

// ============================================
// POST /v1/resolve - Resolve conflict
// ============================================
router.post(
  '/resolve',
  requireScopeAccess('scope'),
  requirePermission('conflicts', 'resolve'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ResolveRequest;
    
    // Validate required fields
    if (!input.scope || !input.cid || !input.message || !input.kind || !input.supersedingId) {
      throw new APIError('BAD_REQUEST', 'Missing required fields', 400, {
        required: ['scope', 'cid', 'message', 'kind', 'supersedingId'],
      });
    }
    
    // Resolve the conflict
    const result = await contextStore.resolve({
      scope: input.scope,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      supersedingId: input.supersedingId,
    });
    
    // Log audit
    logAudit({
      id: `audit_${Date.now()}_resolve`,
      type: 'resolve',
      scope: input.scope,
      entryId: result.entry?.id || '',
      author: 'system',
      timestamp: new Date().toISOString(),
      metadata: { cid: input.cid, supersededId: input.supersedingId },
    });
    
    res.json({
      id: result.entry?.id || '',
      status: result.status,
      supersededId: input.supersedingId,
      entry: result.entry,
    } as any);
  })
);

// ============================================
// POST /v1/fork - Fork scope
// ============================================
router.post(
  '/fork',
  requirePermission('scopes', 'fork'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ForkRequest;
    
    if (!input.scope || !input.parentScope) {
      throw new APIError('BAD_REQUEST', 'scope and parentScope required', 400);
    }
    
    const result = await contextStore.fork(input);
    
    res.status(201).json(result);
  })
);

// ============================================
// POST /v1/merge - Merge scopes
// ============================================
router.post(
  '/merge',
  requirePermission('scopes', 'merge'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as MergeRequest;
    
    if (!input.source || !input.target) {
      throw new APIError('BAD_REQUEST', 'source and target required', 400);
    }
    
    const result = await contextStore.merge(input);
    
    res.json(result);
  })
);

// ============================================
// GET /v1/scopes/:scope/conflicts - List conflicts
// ============================================
router.get(
  '/scopes/:scope/conflicts',
  requireScopeAccess('scope'),
  requirePermission('conflicts', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { scope } = req.params;
    const conflicts = detectConflicts(scope);
    
    res.json({ scope, conflicts });
  })
);

// ============================================
// POST /v1/scopes/:scope/sync - Sync scope
// ============================================
router.post(
  '/scopes/:scope/sync',
  requireScopeAccess('scope'),
  requirePermission('scopes', 'write'),
  asyncHandler(async (req: Request, res: Response) => {
    const { scope } = req.params;
    const { pushOnly, pullOnly } = req.body;
    
    // In a real implementation, this would sync with remote
    // For now, return simulated result
    const result = {
      pushed: 0,
      pulled: 0,
      conflicts: [] as any[],
    };
    
    res.json({ scope, ...result });
  })
);

// ============================================
// GET /v1/scopes/:scope/history - Scope history
// ============================================
router.get(
  '/scopes/:scope/history',
  requireScopeAccess('scope'),
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { scope } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const entries = await contextStore.getScopeHistory(scope, limit, offset);
    res.json({ scope, entries, pagination: { limit, offset } });
  })
);

// ============================================
// GET /v1/entries/:id - Get single entry
// ============================================
router.get(
  '/entries/:id',
  requirePermission('entries', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const entry = await contextStore.getEntry(id);
    
    if (!entry) {
      throw new APIError('NOT_FOUND', 'Entry not found', 404);
    }
    
    res.json(entry);
  })
);

export { router as clientRoute };