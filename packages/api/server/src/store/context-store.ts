import { 
  ReadContextRequest, 
  ReadContextResponse, 
  CommitmentEntry, 
  ConflictInfo, 
  CompileStats, 
  DroppedEntry,
  CommitRequest,
  CommitResponse,
  QueryRequest,
  QueryResponse,
  ResolveRequest,
  ResolveResponse,
  ForkRequest,
  ForkResult,
  MergeRequest,
  MergeResult,
  AuditLog,
  SyncResult,
  SyncState,
} from '../types';

interface StoredEntry extends CommitmentEntry {
  _metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

interface ScopeState {
  name: string;
  parentScope?: string;
  createdAt: Date;
  entries: Map<string, StoredEntry>;
}

interface SyncStateData {
  scope: string;
  lastSync: Date;
  pendingPush: string[];
  pendingPull: string[];
}

// In-memory storage (replace with PostgreSQL in production)
const scopes = new Map<string, ScopeState>();
const syncStates = new Map<string, SyncStateData>();
const auditLogs: AuditLog[] = [];

// Initialize with some test data
function initializeTestData() {
  const mainScope: ScopeState = {
    name: 'project.main',
    createdAt: new Date(),
    entries: new Map(),
  };
  scopes.set(mainScope.name, mainScope);
  
  // Add some test entries
  const testEntry: StoredEntry = {
    id: 'sha256:abc123',
    cid: 'auth.provider',
    message: 'Use Supabase for authentication',
    kind: 'decision',
    scope: 'project.main',
    author: 'user@example.com',
    timestamp: new Date().toISOString(),
    parents: [],
    supersedes: null,
    status: 'active',
    _metadata: { createdAt: new Date(), updatedAt: new Date() },
  };
  mainScope.entries.set(testEntry.id, testEntry);
}

initializeTestData();

export const contextStore = {
  /**
   * Read compiled context for a scope
   */
  async readContext(input: ReadContextRequest): Promise<ReadContextResponse> {
    const scope = scopes.get(input.scope);
    if (!scope) {
      throw new Error(`Scope not found: ${input.scope}`);
    }
    
    // Get all active entries in scope (including inherited)
    const entries = await this.getActiveEntries(input.scope);
    
    // Apply filters
    let filtered = entries.filter(e => {
      if (input.kind && e.kind !== input.kind) return false;
      if (input.cid && e.cid !== input.cid) return false;
      return true;
    });
    
    // Apply token budget
    if (input.budget) {
      filtered = this.applyBudget(filtered, input.budget);
    }
    
    // Detect conflicts
    const conflicts = this.detectConflicts(input.scope);
    
    // Calculate stats
    const stats = this.calculateStats(entries, conflicts);
    
    // Track dropped entries
    const dropped = entries.filter(e => !filtered.includes(e)).map(e => ({
      cid: e.cid,
      kind: e.kind,
      message: e.message,
      sourceScope: e.scope,
      reason: 'budget' as const,
    }));
    
    return {
      entries: filtered,
      conflicts,
      stats,
      dropped,
      logs: [],
    };
  },

  /**
   * Create a new context entry
   */
  async commit(input: CommitRequest): Promise<CommitResponse> {
    const scope = scopes.get(input.scope);
    if (!scope) {
      throw new Error(`Scope not found: ${input.scope}`);
    }
    
    // Check for exact duplicate
    const existingByContent = Array.from(scope.entries.values())
      .find(e => e.cid === input.cid && e.message === input.message);
    
    if (existingByContent) {
      return {
        id: existingByContent.id,
        status: 'already_exists',
        entry: existingByContent,
      };
    }
    
    // Check for conflict (same CID, different message)
    const conflictEntry = Array.from(scope.entries.values())
      .find(e => e.cid === input.cid && e.message !== input.message && e.status === 'active');
    
    const id = `sha256:${crypto.randomBytes(16).toString('hex')}`;
    const now = new Date().toISOString();
    
    const entry: StoredEntry = {
      id,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      scope: input.scope,
      author: input.author,
      timestamp: now,
      parents: input.parents || [],
      supersedes: input.supersedes || null,
      status: 'active',
      _metadata: { createdAt: new Date(), updatedAt: new Date() },
    };
    
    // If superseding, mark old entry as superseded
    if (input.supersedes) {
      const oldEntry = scope.entries.get(input.supersedes);
      if (oldEntry) {
        oldEntry.status = 'superseded';
        oldEntry._metadata.updatedAt = new Date();
      }
    }
    
    scope.entries.set(id, entry);
    
    // Log audit event
    this.logAudit({
      id: `audit_${Date.now()}`,
      type: 'commit',
      scope: input.scope,
      entryId: id,
      author: input.author,
      timestamp: now,
      metadata: { cid: input.cid, kind: input.kind },
    });
    
    if (conflictEntry) {
      this.logAudit({
        id: `audit_${Date.now()}_conflict`,
        type: 'conflict_detected',
        scope: input.scope,
        entryId: id,
        author: input.author,
        timestamp: now,
        metadata: { 
          existingId: conflictEntry.id, 
          existingMessage: conflictEntry.message,
          incomingMessage: input.message,
        },
      });
      
      return {
        id,
        status: 'conflict',
        entry,
        conflict: {
          scope: input.scope,
          cid: input.cid,
          existingEntry: conflictEntry,
          incomingEntry: entry,
        },
      };
    }
    
    return { id, status: 'committed', entry };
  },

  /**
   * Query entries with filters
   */
  async query(input: QueryRequest): Promise<QueryResponse> {
    const results: CommitmentEntry[] = [];
    
    // If scope specified, search only that scope
    if (input.scope) {
      const scope = scopes.get(input.scope);
      if (scope) {
        results.push(...this.filterEntries(Array.from(scope.entries.values()), input));
      }
    } else {
      // Search all scopes
      for (const scope of scopes.values()) {
        results.push(...this.filterEntries(Array.from(scope.entries.values()), input));
      }
    }
    
    return { entries: results };
  },

  /**
   * Resolve a conflict by superseding
   */
  async resolve(input: ResolveRequest): Promise<ResolveResponse> {
    const scope = scopes.get(input.scope);
    if (!scope) {
      throw new Error(`Scope not found: ${input.scope}`);
    }
    
    const superseded = scope.entries.get(input.supersedingId);
    if (!superseded) {
      throw new Error(`Superseded entry not found: ${input.supersedingId}`);
    }
    
    // Create resolution entry
    const resolutionEntry: StoredEntry = {
      id: `sha256:${crypto.randomBytes(16).toString('hex')}`,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      scope: input.scope,
      author: input.author,
      timestamp: new Date().toISOString(),
      parents: [superseded.id],
      supersedes: input.supersedingId,
      status: 'active',
      _metadata: { createdAt: new Date(), updatedAt: new Date() },
    };
    
    // Mark old entry as superseded
    superseded.status = 'superseded';
    superseded._metadata.updatedAt = new Date();
    
    scope.entries.set(resolutionEntry.id, resolutionEntry);
    
    // Check if conflict still exists
    const otherEntries = Array.from(scope.entries.values())
      .filter(e => e.cid === input.cid && e.status === 'active' && e.id !== resolutionEntry.id);
    
    const status = otherEntries.length > 0 ? 'conflict_persists' : 'resolved';
    
    this.logAudit({
      id: `audit_${Date.now()}_resolve`,
      type: 'resolve',
      scope: input.scope,
      entryId: resolutionEntry.id,
      author: input.author,
      timestamp: new Date().toISOString(),
      metadata: { supersededId: input.supersedingId, cid: input.cid },
    });
    
    return { 
      id: resolutionEntry.id, 
      status, 
      supersededId: input.supersedingId, 
      entry: resolutionEntry 
    };
  },

  /**
   * Fork a new scope from parent
   */
  async fork(input: ForkRequest): Promise<ForkResult> {
    const parentScope = scopes.get(input.parentScope);
    if (!parentScope) {
      throw new Error(`Parent scope not found: ${input.parentScope}`);
    }
    
    if (scopes.has(input.scope)) {
      throw new Error(`Scope already exists: ${input.scope}`);
    }
    
    const newScope: ScopeState = {
      name: input.scope,
      parentScope: input.parentScope,
      createdAt: new Date(),
      entries: new Map(),
    };
    
    // Inherit active entries from parent
    let inherited = 0;
    for (const entry of parentScope.entries.values()) {
      if (entry.status === 'active') {
        const inheritedEntry: StoredEntry = {
          ...entry,
          scope: input.scope,
          id: `sha256:${crypto.randomBytes(16).toString('hex')}`,
          _metadata: { createdAt: new Date(), updatedAt: new Date() },
        };
        newScope.entries.set(inheritedEntry.id, inheritedEntry);
        inherited++;
      }
    }
    
    scopes.set(input.scope, newScope);
    
    this.logAudit({
      id: `audit_${Date.now()}_fork`,
      type: 'fork',
      scope: input.scope,
      entryId: '',
      author: 'system',
      timestamp: new Date().toISOString(),
      metadata: { parentScope: input.parentScope, inheritedEntries: inherited },
    });
    
    return { 
      scope: input.scope, 
      parentScope: input.parentScope, 
      status: 'forked', 
      inheritedEntries: inherited 
    };
  },

  /**
   * Merge source scope into target
   */
  async merge(input: MergeRequest): Promise<MergeResult> {
    const sourceScope = scopes.get(input.source);
    const targetScope = scopes.get(input.target);
    
    if (!sourceScope) throw new Error(`Source scope not found: ${input.source}`);
    if (!targetScope) throw new Error(`Target scope not found: ${input.target}`);
    
    const conflicts: ConflictInfo[] = [];
    let adopted = 0;
    let rejected = 0;
    const adoptedEntries: CommitmentEntry[] = [];
    
    for (const entry of sourceScope.entries.values()) {
      if (entry.status !== 'active') continue;
      
      const targetEntry = Array.from(targetScope.entries.values())
        .find(e => e.cid === entry.cid && e.status === 'active');
      
      if (!targetEntry) {
        // No conflict, adopt
        const adoptedEntry: StoredEntry = {
          ...entry,
          scope: input.target,
          id: `sha256:${crypto.randomBytes(16).toString('hex')}`,
          _metadata: { createdAt: new Date(), updatedAt: new Date() },
        };
        targetScope.entries.set(adoptedEntry.id, adoptedEntry);
        adoptedEntries.push(adoptedEntry);
        adopted++;
      } else if (targetEntry.message === entry.message) {
        // Same message, reject as duplicate
        rejected++;
      } else {
        // Conflict!
        conflicts.push({
          scope: input.target,
          cid: entry.cid,
          existingEntry: targetEntry,
          incomingEntry: entry,
        });
      }
    }
    
    this.logAudit({
      id: `audit_${Date.now()}_merge`,
      type: 'merge',
      scope: input.target,
      entryId: '',
      author: 'system',
      timestamp: new Date().toISOString(),
      metadata: { source: input.source, adopted, conflicts: conflicts.length },
    });
    
    return {
      status: conflicts.length > 0 ? 'conflict' : 'merged',
      adopted,
      conflicts,
      rejected,
      entries: adoptedEntries,
    };
  },

  /**
   * Get active entries for a scope (including inherited)
   */
  async getActiveEntries(scopeName: string): Promise<CommitmentEntry[]> {
    const scope = scopes.get(scopeName);
    if (!scope) return [];
    
    const entries = Array.from(scope.entries.values())
      .filter(e => e.status === 'active');
    
    // Include inherited entries from parent
    if (scope.parentScope) {
      const parentEntries = await this.getActiveEntries(scope.parentScope);
      const existingCids = new Set(entries.map(e => e.cid));
      
      for (const parentEntry of parentEntries) {
        if (!existingCids.has(parentEntry.cid)) {
          entries.push({ ...parentEntry, scope: scopeName });
        }
      }
    }
    
    return entries;
  },

  /**
   * Get scope history
   */
  async getScopeHistory(scopeName: string, limit = 100, offset = 0): Promise<CommitmentEntry[]> {
    const scope = scopes.get(scopeName);
    if (!scope) return [];
    
    return Array.from(scope.entries.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);
  },

  /**
   * Get a specific entry by ID
   */
  async getEntry(id: string): Promise<CommitmentEntry | null> {
    for (const scope of scopes.values()) {
      const entry = scope.entries.get(id);
      if (entry) return entry;
    }
    return null;
  },

  /**
   * Get sync state for a scope
   */
  async getSyncState(scope: string): Promise<SyncStateData | null> {
    return syncStates.get(scope) || null;
  },

  /**
   * Update sync state
   */
  async updateSyncState(scope: string, state: Partial<SyncStateData>): Promise<void> {
    const existing = syncStates.get(scope) || { scope, lastSync: new Date(), pendingPush: [], pendingPull: [] };
    syncStates.set(scope, { ...existing, ...state, scope });
  },

  /**
   * Log audit event
   */
  logAudit(log: AuditLog): void {
    auditLogs.push(log);
    // Keep only last 10000 logs
    if (auditLogs.length > 10000) {
      auditLogs.shift();
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(scope?: string, limit = 100): Promise<AuditLog[]> {
    let logs = auditLogs;
    if (scope) {
      logs = logs.filter(l => l.scope === scope);
    }
    return logs.slice(-limit);
  },

  // Private helpers
  filterEntries(entries: StoredEntry[], input: QueryRequest): CommitmentEntry[] {
    return entries.filter(e => {
      if (input.id && e.id !== input.id) return false;
      if (input.cid && e.cid !== input.cid) return false;
      if (input.kind && e.kind !== input.kind) return false;
      if (input.status && e.status !== input.status) return false;
      return true;
    });
  },

  detectConflicts(scopeName: string): ConflictInfo[] {
    const scope = scopes.get(scopeName);
    if (!scope) return [];
    
    const conflicts: ConflictInfo[] = [];
    const byCid = new Map<string, StoredEntry[]>();
    
    for (const entry of scope.entries.values()) {
      if (entry.status !== 'active') continue;
      const existing = byCid.get(entry.cid) || [];
      existing.push(entry);
      byCid.set(entry.cid, existing);
    }
    
    for (const [cid, entries] of byCid.entries()) {
      if (entries.length > 1) {
        for (let i = 0; i < entries.length; i++) {
          for (let j = i + 1; j < entries.length; j++) {
            if (entries[i].message !== entries[j].message) {
              conflicts.push({
                scope: scopeName,
                cid,
                existingEntry: entries[i],
                incomingEntry: entries[j],
              });
            }
          }
        }
      }
    }
    
    return conflicts;
  },

  applyBudget(entries: CommitmentEntry[], budget: number): CommitmentEntry[] {
    // Sort by kind priority: rules first, then decisions, then observations
    const priority: Record<string, number> = { rule: 0, decision: 1, observation: 2 };
    const sorted = [...entries].sort((a, b) => priority[a.kind] - priority[b.kind]);
    
    let total = 0;
    const result: CommitmentEntry[] = [];
    
    for (const entry of sorted) {
      const tokens = Math.ceil(entry.message.length / 4) + 10;
      if (total + tokens <= budget) {
        result.push(entry);
        total += tokens;
      }
    }
    
    return result;
  },

  calculateStats(entries: CommitmentEntry[], conflicts: ConflictInfo[]): CompileStats {
    return {
      totalActive: entries.length,
      inherited: 0, // Would need inheritance tracking
      overridden: 0,
      conflicts: conflicts.length,
      dropped: 0,
      compressed: 0,
      tokenCount: entries.reduce((sum, e) => sum + Math.ceil(e.message.length / 4) + 10, 0),
      budget: 0,
    };
  },
};

// Export for use in routes
export { scopes, syncStates, auditLogs };