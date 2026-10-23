import type { ContextEntry, EntryKind } from "../types";

export type ResolutionRuleName = "authority" | "recency" | "scope_specificity" | "confidence";

export type ConfidenceFn = (entry: ContextEntry) => number;

export interface ResolutionRule {
  name: ResolutionRuleName;
  reason: string;
}

export interface ResolutionRecord {
  id: string;
  method: "auto" | "manual";
  rules: ResolutionRule[];
  resolvedBy: string;
  timestamp: string;
}

export interface AggregatedConflict {
  id: string;
  scope: string;
  cid: string;
  type: "divergent" | "scope_collision" | "merge";
  source: "store" | "compiler" | "sync";
  entries: [ContextEntry, ContextEntry];
  detectedAt: string;
  status: "unresolved" | "auto_resolved" | "manual_resolved";
  resolution?: ResolutionRecord;
}

export interface AutoResolveResult {
  scope: string;
  total: number;
  resolved: number;
  skipped: number;
  resolutions: Array<{
    conflictId: string;
    cid: string;
    rule: ResolutionRule;
    supersedingEntryId: string;
    supersededIds: string[];
  }>;
  skippedConflicts: Array<{
    conflictId: string;
    cid: string;
    reason: string;
  }>;
}

export interface ManualResolveInput {
  scope: string;
  cid: string;
  message: string;
  kind: EntryKind;
  author: string;
  supersedingId: string;
}

export interface EscalationPolicy {
  owner: string[];
  admins: string[];
  delegates: string[];
}

export interface FeedbackRecord {
  conflictId: string;
  autoResolutionEntryId: string;
  humanOverrideEntryId?: string;
  disagreed: boolean;
  notes?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface ResolverStats {
  totalConflicts: number;
  autoResolved: number;
  manualResolved: number;
  unresolved: number;
  feedbackDisagreements: number;
  feedbackAgreements: number;
}