import { type ContextEntry, type Conflict } from "../index";
import { type CloudRelay, type PullOptions, type PullResult, type PushResult, type RelayScopeState } from "./types";

export class InMemoryRelay implements CloudRelay {
  private entries = new Map<string, ContextEntry>();
  private scopeIndex = new Map<string, Set<string>>();
  private clock = new Date("2026-07-27T10:00:00Z");

  constructor(preload?: ContextEntry[]) {
    if (preload) {
      for (const e of preload) {
        this.storeEntry(e);
      }
    }
  }

  private tick(): string {
    this.clock = new Date(this.clock.getTime() + 1);
    return this.clock.toISOString();
  }

  private storeEntry(entry: ContextEntry): void {
    this.entries.set(entry.id, entry);
    if (!this.scopeIndex.has(entry.scope)) {
      this.scopeIndex.set(entry.scope, new Set());
    }
    this.scopeIndex.get(entry.scope)!.add(entry.id);
  }

  async push(_scope: string, entries: ContextEntry[]): Promise<PushResult[]> {
    return entries.map((entry) => {
      const existing = this.entries.get(entry.id);
      if (existing) {
        return {
          id: entry.id,
          status: "duplicate" as const,
          relayTimestamp: existing.timestamp,
        };
      }

      const relayEntry: ContextEntry = {
        ...entry,
        timestamp: this.tick(),
      };
      this.storeEntry(relayEntry);

      // Check for conflicts with existing entries in the same scope+cid
      const conflict = this.detectConflict(relayEntry);

      return {
        id: relayEntry.id,
        status: conflict ? ("conflict" as const) : ("accepted" as const),
        relayTimestamp: relayEntry.timestamp,
        conflict,
      };
    });
  }

  async pull(scope: string, opts: PullOptions): Promise<PullResult> {
    const entryIds = this.scopeIndex.get(scope);
    if (!entryIds || entryIds.size === 0) {
      return { entries: [], hasMore: false, latestEntryId: null, latestTimestamp: null };
    }

    // Collect all entries for the scope, sorted by timestamp
    const allEntries: ContextEntry[] = [];
    for (const id of entryIds) {
      const entry = this.entries.get(id);
      if (entry) allEntries.push(entry);
    }
    allEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Filter by since
    let filtered = allEntries;
    if (opts.sinceEntryId) {
      const sinceIdx = allEntries.findIndex((e) => e.id === opts.sinceEntryId);
      if (sinceIdx !== -1) {
        filtered = allEntries.slice(sinceIdx + 1);
      }
    } else if (opts.sinceTimestamp) {
      filtered = allEntries.filter((e) => e.timestamp > opts.sinceTimestamp!);
    }

    const limit = opts.limit ?? filtered.length;
    const limited = filtered.slice(0, limit);
    const hasMore = limited.length < filtered.length;

    const last = limited[limited.length - 1];

    return {
      entries: limited,
      hasMore,
      latestEntryId: last?.id ?? null,
      latestTimestamp: last?.timestamp ?? null,
    };
  }

  async getState(scope: string): Promise<RelayScopeState | null> {
    const entryIds = this.scopeIndex.get(scope);
    if (!entryIds || entryIds.size === 0) return null;

    const entries: ContextEntry[] = [];
    for (const id of entryIds) {
      const e = this.entries.get(id);
      if (e) entries.push(e);
    }
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const last = entries[entries.length - 1];

    return {
      entryCount: entries.length,
      latestEntryId: last?.id ?? null,
      latestTimestamp: last?.timestamp ?? null,
    };
  }

  getAll(): ContextEntry[] {
    return Array.from(this.entries.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
  }

  private detectConflict(entry: ContextEntry): Conflict | undefined {
    const entryIds = this.scopeIndex.get(entry.scope);
    if (!entryIds) return;

    for (const id of entryIds) {
      if (id === entry.id) continue;
      const existing = this.entries.get(id)!;
      if (existing.cid === entry.cid && existing.message !== entry.message) {
        const newSupersedesOld = entry.supersedes === existing.id;
        const oldSupersedesNew = existing.supersedes === entry.id;
        if (!newSupersedesOld && !oldSupersedesNew) {
          return {
            scope: entry.scope,
            cid: entry.cid,
            existingEntry: existing,
            incomingEntry: entry,
          };
        }
      }
    }
    return undefined;
  }
}

export { type CloudRelay, type PullOptions, type PullResult, type PushResult, type RelayScopeState };