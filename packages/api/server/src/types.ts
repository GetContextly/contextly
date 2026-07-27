export interface APIKey {
  id: string;
  key: string;
  name: string;
  scopes: string[];
  permissions: Permission[];
  rateLimit: number;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  tenantId: string;
  isActive: boolean;
}

export type PermissionResource = 'entries' | 'scopes' | 'conflicts' | 'webhooks' | 'commits';
export type PermissionAction = 'read' | 'write' | 'resolve' | 'fork' | 'merge';

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

export interface Tenant {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  createdAt: Date;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: APIKey;
  tenant?: Tenant;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export interface ReadContextRequest {
  scope: string;
  budget?: number;
  kind?: 'decision' | 'rule' | 'observation';
  cid?: string;
  task?: string;
}

export interface ReadContextResponse {
  entries: ContextEntry[];
  conflicts: Conflict[];
  stats: CompileStats;
  dropped: DroppedEntry[];
  logs: AuditLog[];
}

export interface ContextEntry {
  id: string;
  cid: string;
  message: string;
  kind: 'decision' | 'rule' | 'observation';
  scope: string;
  author: string;
  timestamp: string;
  parents: string[];
  supersedes: string | null;
  status: 'active' | 'superseded' | 'archived' | 'tombstoned';
  provenance: {
    sourceScope: string;
    inherited: boolean;
    fromParent: string | null;
    supersedesChain: string[];
  };
}

export interface Conflict {
  cid: string;
  existingEntry: ContextEntry;
  incomingEntry: ContextEntry;
}

export interface CompileStats {
  totalActive: number;
  inherited: number;
  overridden: number;
  conflicts: number;
  dropped: number;
  compressed: number;
  tokenCount: number;
  budget: number;
}

export interface DroppedEntry {
  cid: string;
  kind: string;
  message: string;
  sourceScope: string;
  reason: 'budget' | 'compressed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'insert' | 'supersede' | 'resolve' | 'fork' | 'merge' | 'conflict_detected';
  scope: string;
  author: string;
  details: Record<string, any>;
}

export interface CommitRequest {
  scope: string;
  cid: string;
  message: string;
  kind: 'decision' | 'rule' | 'observation';
  supersedes?: string;
  parents?: string[];
}

export interface CommitResponse {
  id: string;
  status: 'committed' | 'conflict' | 'already_exists';
  entry?: ContextEntry;
  conflict?: {
    cid: string;
    existingMessage: string;
    existingId: string;
    incomingMessage: string;
    incomingId: string;
  };
}

export interface QueryRequest {
  scope?: string;
  cid?: string;
  kind?: 'decision' | 'rule' | 'observation';
  status?: 'active' | 'superseded' | 'archived' | 'tombstoned';
  id?: string;
}

export interface QueryResponse {
  entries: ContextEntry[];
}

export interface ResolveRequest {
  scope: string;
  cid: string;
  message: string;
  kind: 'decision' | 'rule' | 'observation';
  supersedingId: string;
}

export interface ResolveResponse {
  id: string;
  status: 'resolved' | 'conflict_persists';
  supersededId: string;
  entry?: ContextEntry;
}

export interface ForkRequest {
  scope: string;
  parentScope: string;
}

export interface ForkResponse {
  scope: string;
  parentScope: string;
  status: 'forked';
  inheritedEntries: number;
}

export interface MergeRequest {
  source: string;
  target: string;
}

export interface MergeResponse {
  status: 'merged' | 'conflict';
  adopted: number;
  conflicts: number | Conflict[];
  rejected: number;
  entries?: ContextEntry[];
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  auth: {
    secret: string;
    headers: Record<string, string>;
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  idempotencyWindow: number;
  createdAt: Date;
  isActive: boolean;
}

export type WebhookEvent = 
  | 'context.created'
  | 'context.resolved'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'scope.forked'
  | 'scope.merged';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  idempotencyKey: string;
}

export interface UsageRecord {
  id: string;
  timestamp: Date;
  apiKeyId: string;
  tenantId: string;
  scope?: string;
  operation: string;
  tokensUsed: number;
  durationMs: number;
  status: 'success' | 'error';
  errorCode?: string;
}