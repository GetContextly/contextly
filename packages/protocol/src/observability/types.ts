import type { Conflict, ContextEntry } from "../types.js";
import type { CompiledContext, DropRecord, Provenance } from "../compiler-types.js";

export type AuditEventType =
  | "entry.insert"
  | "entry.supersede"
  | "entry.archive"
  | "entry.tombstone"
  | "conflict.detected"
  | "conflict.auto_resolved"
  | "conflict.manual_resolved"
  | "sync.push"
  | "sync.pull"
  | "sync.merge"
  | "access.read"
  | "access.query"
  | "access.write"
  | "scope.fork"
  | "scope.merge";

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  scope: string;
  actor: string;
  details: Record<string, unknown>;
}

export interface EnhancedProvenance extends Provenance {
  resolutionRule?: { name: string; reason: string };
  syncOrigin?: "local" | "pulled" | "inherited";
  auditEventIds: string[];
}

export interface TraceStep {
  entry: ContextEntry;
  howReached: "original" | "superseded" | "parent" | "inherited" | "resolution" | "fork";
  resolutionRule?: { name: string; reason: string };
  children: TraceStep[];
}

export interface DecisionTrace {
  rootEntry: ContextEntry;
  compiledIn: string[];
  droppedBy: DropRecord[];
  fullAncestry: TraceStep[];
  auditEvents: AuditEvent[];
}

export interface MetricPoint {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface MetricsSnapshot {
  otelMetrics: string;
  raw: MetricPoint[];
  timeWindowMs: number;
}

export type AlertSeverity = "info" | "warn" | "critical";

export interface AlertSignal {
  rule: string;
  severity: AlertSeverity;
  message: string;
  scope: string;
  timestamp: string;
  context: Record<string, unknown>;
}

export type AlertRule = {
  name: string;
  description: string;
  severity: AlertSeverity;
  check: (ctx: AlertContext) => AlertSignal | null;
};

export interface AlertContext {
  getConflicts: (scope: string) => Conflict[];
  getRecentEvents: (scope: string, sinceMs: number) => AuditEvent[];
  getSyncState: (scope: string) => { lastSyncTimestamp: string | null; status: string };
}

export interface ExplainResult {
  entry: ContextEntry;
  supersessionChain: ContextEntry[];
  parentDag: ContextEntry[];
  descendants: ContextEntry[];
  resolutionEvents: AuditEvent[];
  provenance: EnhancedProvenance | null;
}

export interface WhyDroppedResult {
  entry: ContextEntry | null;
  compiledContext: CompiledContext | null;
  reason: DropRecord | null;
  ancestorEntries: ContextEntry[];
}

export interface TenantExportOptions {
  scopes: string[];
  since?: string;
  until?: string;
  eventTypes?: AuditEventType[];
  format?: "jsonl" | "json";
}