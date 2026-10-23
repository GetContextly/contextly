import type { EntryKind, EntryStatus } from "@contextly/protocol";

export interface Provenance {
  sourceScope: string;
  inherited: boolean;
  fromParent: string | null;
  supersedesChain: string[];
}

export interface ContextlyConfig {
  token: string;
  dbPath?: string;
}

export interface ReadOptions {
  budget?: number;
  kind?: EntryKind;
  cid?: string;
  task?: string;
}

export interface ReadResult {
  entries: Array<{
    id: string;
    cid: string;
    message: string;
    kind: EntryKind;
    timestamp: string;
    provenance: Provenance;
  }>;
  conflicts: Array<{
    cid: string;
    existingMessage: string;
    existingId: string;
    incomingMessage: string;
    incomingId: string;
  }>;
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
    kind: EntryKind;
    message: string;
    sourceScope: string;
    reason: "budget" | "compressed";
  }>;
}

export interface CommitInput {
  cid: string;
  message: string;
  kind?: EntryKind;
  supersedes?: string;
}

export interface CommitResult {
  id: string;
  status: "committed" | "conflict" | "already_exists";
  entry: {
    id: string;
    cid: string;
    message: string;
    kind: EntryKind;
    scope: string;
    author: string;
    timestamp: string;
    supersedes: string | null;
    status: EntryStatus;
  };
  conflict?: {
    cid: string;
    existingMessage: string;
    existingId: string;
    incomingMessage: string;
    incomingId: string;
  };
}

export interface QueryFilter {
  id?: string;
  cid?: string;
  kind?: EntryKind;
  status?: EntryStatus;
}

export interface QueryResult {
  entries: Array<{
    id: string;
    cid: string;
    message: string;
    kind: EntryKind;
    scope: string;
    author: string;
    timestamp: string;
    supersedes: string | null;
    status: EntryStatus;
  }>;
}

export interface ResolveInput {
  cid: string;
  message: string;
  kind: EntryKind;
  supersedingId: string;
}

export interface ResolveResult {
  id: string;
  status: "resolved" | "conflict_persists";
  supersededId: string;
  entry: {
    id: string;
    cid: string;
    message: string;
    kind: EntryKind;
    scope: string;
    author: string;
    timestamp: string;
    supersedes: string | null;
    status: EntryStatus;
  };
}

export interface ForkResult {
  scope: string;
  parentScope: string;
  status: "forked";
  inheritedEntries: number;
}

export interface MergeInput {
  source: string;
  target: string;
}

export interface MergeResult {
  status: "merged" | "conflict";
  adopted: number;
  conflicts: number | Array<{
    cid: string;
    existingMessage: string;
    incomingMessage: string;
  }>;
  rejected: number;
  entries?: Array<{
    id: string;
    cid: string;
    message: string;
    kind: EntryKind;
  }>;
}

export interface ConflictInfo {
  cid: string;
  existingMessage: string;
  existingId: string;
  incomingMessage: string;
  incomingId: string;
}