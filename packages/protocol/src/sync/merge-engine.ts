import { Store, type Conflict, type ContextEntry } from "../index";
import { Compiler } from "../compiler";
import { type MergeResult } from "./types";

export class MergeEngine {
  private store: Store;
  private compiler: Compiler;

  constructor(store: Store, compiler: Compiler) {
    this.store = store;
    this.compiler = compiler;
  }

  merge(source: string, target: string): MergeResult {
    if (!this.store.scopeExists(source)) {
      throw new Error(`Source scope "${source}" does not exist`);
    }
    if (!this.store.scopeExists(target)) {
      throw new Error(`Target scope "${target}" does not exist`);
    }

    const sourceActive = this.store.getAllActiveForScope(source);
    const adopted: ContextEntry[] = [];
    const conflicts: Conflict[] = [];
    const rejected: ContextEntry[] = [];

    for (const entry of sourceActive) {
      const targetEntries = this.store.getByScopeAndCid(target, entry.cid);

      if (targetEntries.length === 0) {
        // No entry in target → adopt
        const result = this.store.insert({
          cid: entry.cid,
          message: entry.message,
          kind: entry.kind,
          scope: target,
          author: entry.author,
          supersedes: undefined,
          parents: entry.parents ? [entry.id, ...(entry.parents ?? [])] : [entry.id],
        });
        adopted.push(result.entry);
      } else if (targetEntries.some((t) => t.message === entry.message)) {
        // Same message already exists → skip (duplicate)
        rejected.push(entry);
      } else {
        // Different message → conflict
        conflicts.push({
          scope: target,
          cid: entry.cid,
          existingEntry: targetEntries[0],
          incomingEntry: entry,
        });
      }
    }

    if (conflicts.length === 0) {
      this.compiler.invalidateScope(target);
    }

    return { adopted, conflicts, rejected };
  }
}