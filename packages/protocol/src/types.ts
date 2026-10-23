export type EntryKind = "decision" | "rule" | "observation";

export type EntryStatus = "active" | "superseded" | "archived" | "tombstoned";

export interface ContextEntry {
  id: string;
  cid: string;
  message: string;
  kind: EntryKind;
  scope: string;
  author: string;
  timestamp: string;
  parents: string[];
  supersedes: string | null;
  status: EntryStatus;
}

export interface InsertEntry {
  cid: string;
  message: string;
  kind: EntryKind;
  scope: string;
  author: string;
  parents?: string[];
  supersedes?: string | null;
}

export interface Conflict {
  scope: string;
  cid: string;
  existingEntry: ContextEntry;
  incomingEntry: ContextEntry;
}

export interface InsertResult {
  entry: ContextEntry;
  conflict: Conflict | null;
}

export type StoreErrorCode =
  | "DUPLICATE_ENTRY"
  | "SUPERSEDES_TARGET_NOT_FOUND"
  | "SUPERSEDES_TARGET_ALREADY_SUPERSEDED"
  | "CYCLE_DETECTED"
  | "SELF_SUPERSEDE"
  | "INVALID_KIND"
  | "INVALID_STATUS";

export class StoreError extends Error {
  constructor(
    public code: StoreErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StoreError";
  }
}