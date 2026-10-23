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
  isActive: boolean;
  tenantId: string;
}

export interface Permission {
  resource: 'entries' | 'scopes' | 'commits' | 'conflicts' | 'webhooks';
  actions: ('read' | 'write' | 'resolve' | 'fork' | 'merge')[];
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
  user?: { id: string; email: string; name: string };
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  payload: Record<string, unknown>;
  timestamp: Date;
  signature: string;
  idempotencyKey: string;
  deliveryCount: number;
  nextRetryAt?: Date;
}

export type WebhookEventType =
  | 'commitment.created'
  | 'commitment.updated'
  | 'commitment.deleted'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'scope.forked'
  | 'scope.merged'
  | 'sync.completed'
  | 'sync.failed';

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  headers?: Record<string, string>;
  retryConfig: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
  idempotencyWindowMs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventId: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'exhausted';
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CommitmentEntry {
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
}

export interface ConflictInfo {
  scope: string;
  cid: string;
  existingEntry: CommitmentEntry;
  incomingEntry: CommitmentEntry;
}

export interface ForkResult {
  scope: string;
  parentScope: string;
  status: 'forked';
  inheritedEntries: number;
}

export interface MergeResult {
  status: 'merged' | 'conflict';
  adopted: number;
  conflicts: ConflictInfo[];
  rejected: number;
  entries?: CommitmentEntry[];
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: ConflictInfo[];
}

export interface ReadContextRequest {
  scope: string;
  budget?: number;
  kind?: CommitmentEntry['kind'];
  cid?: string;
  task?: string;
}

export interface ReadContextResponse {
  entries: CommitmentEntry[];
  conflicts: ConflictInfo[];
  stats: {
    totalActive: number;
    inherited: number;
    overridden: number;
    conflicts: number;
    dropped: number;
    compressed: number;
    tokenCount: number;
    budget: number;
  };
  dropped: Array<{
    cid: string;
    kind: CommitmentEntry['kind'];
    message: string;
    sourceScope: string;
    reason: 'budget' | 'compressed';
  }>;
}

export interface CommitRequest {
  scope: string;
  cid: string;
  message: string;
  kind: CommitmentEntry['kind'];
  supersedes?: string;
}

export interface CommitResponse {
  id: string;
  status: 'committed' | 'conflict' | 'already_exists';
  entry?: CommitmentEntry;
  conflict?: ConflictInfo;
}

export interface QueryRequest {
  scope: string;
  id?: string;
  cid?: string;
  kind?: CommitmentEntry['kind'];
  status?: CommitmentEntry['status'];
}

export interface QueryResponse {
  entries: CommitmentEntry[];
}

export interface ResolveRequest {
  scope: string;
  cid: string;
  message: string;
  kind: CommitmentEntry['kind'];
  supersedingId: string;
}

export interface ResolveResponse {
  id: string;
  status: 'resolved' | 'conflict_persists';
  supersededId: string;
  entry: CommitmentEntry;
}

export interface ForkRequest {
  scope: string;
  parentScope: string;
}

export interface MergeRequest {
  source: string;
  target: string;
}

export interface SyncRequest {
  scope: string;
  pushOnly?: boolean;
  pullOnly?: boolean;
}