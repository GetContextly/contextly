import { type Conflict, type ContextEntry } from "../types";

export interface PushResult {
  id: string;
  status: "accepted" | "duplicate" | "conflict" | "rejected";
  relayTimestamp: string;
  conflict?: Conflict;
}

export interface PullOptions {
  sinceEntryId?: string;
  sinceTimestamp?: string;
  limit?: number;
}

export interface PullResult {
  entries: ContextEntry[];
  hasMore: boolean;
  latestEntryId: string | null;
  latestTimestamp: string | null;
}

export interface RelayScopeState {
  entryCount: number;
  latestEntryId: string | null;
  latestTimestamp: string | null;
}

export interface CloudRelay {
  push(scope: string, entries: ContextEntry[]): Promise<PushResult[]>;
  pull(scope: string, opts: PullOptions): Promise<PullResult>;
  getState(scope: string): Promise<RelayScopeState | null>;
}

export type PendingStatus = "pending" | "synced" | "failed";

export interface PendingEntry {
  scope: string;
  entryId: string;
  localTimestamp: string;
  status: PendingStatus;
  retryCount: number;
}

export interface SyncState {
  scope: string;
  lastSyncTimestamp: string | null;
  lastEntryId: string | null;
  status: "synced" | "pending" | "conflict";
}

export interface SyncSummary {
  scope: string;
  pushed: PendingResult[];
  pulled: number;
  conflicts: Conflict[];
  errors: Array<{ entryId: string; code: string; message: string }>;
}

export interface PendingResult {
  entryId: string;
  status: "accepted" | "duplicate" | "conflict" | "failed";
}

export interface MergeResult {
  adopted: ContextEntry[];
  conflicts: Conflict[];
  rejected: ContextEntry[];
}

export interface SyncError {
  entryId: string;
  code: string;
  message: string;
}