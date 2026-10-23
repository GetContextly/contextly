import { type Conflict, type ContextEntry, type EntryKind } from "./types";

export interface CompilerOptions {
  scope: string;
  budget?: number;
  kind?: EntryKind;
  cid?: string;
  task?: string;
}

export interface Provenance {
  sourceScope: string;
  inherited: boolean;
  fromParent: string | null;
  supersedesChain: string[];
}

export interface CompiledEntry {
  entry: ContextEntry;
  provenance: Provenance;
}

export interface DropRecord {
  cid: string;
  kind: EntryKind;
  message: string;
  sourceScope: string;
  reason: "budget" | "compressed";
}

export interface CompiledContext {
  entries: CompiledEntry[];
  conflicts: Conflict[];
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
  dropped: DropRecord[];
}

export interface CacheEntry {
  result: CompiledContext;
  scopeVersion: number;
}