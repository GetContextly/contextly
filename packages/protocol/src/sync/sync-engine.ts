import Database from "better-sqlite3";
import { Store, type Conflict, type ContextEntry, type InsertEntry } from "../index";
import { Compiler } from "../compiler";
import { type CloudRelay, type SyncSummary, type PendingResult, type PendingEntry, type SyncState } from "./types";

function isoNow(): string {
  return new Date().toISOString();
}

function rowToPending(row: Record<string, unknown>): PendingEntry {
  return {
    scope: row.scope as string,
    entryId: row.entry_id as string,
    localTimestamp: row.local_timestamp as string,
    status: row.status as PendingEntry["status"],
    retryCount: row.retry_count as number,
  };
}

function rowToSyncState(row: Record<string, unknown>): SyncState {
  return {
    scope: row.scope as string,
    lastSyncTimestamp: (row.last_sync_timestamp as string) ?? null,
    lastEntryId: (row.last_entry_id as string) ?? null,
    status: row.status as SyncState["status"],
  };
}

export class SyncEngine {
  private db: Database.Database;
  private store: Store;
  private compiler: Compiler;
  private relay: CloudRelay;

  constructor(store: Store, compiler: Compiler, relay: CloudRelay, dbPath?: string) {
    this.store = store;
    this.compiler = compiler;
    this.relay = relay;
    this.db = new Database(dbPath ?? ":memory:");
    this.db.pragma("journal_mode = WAL");
    this.initTables();
  }

  close(): void {
    this.db.close();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_state (
        scope               TEXT PRIMARY KEY,
        last_sync_timestamp TEXT,
        last_entry_id       TEXT,
        status              TEXT NOT NULL DEFAULT 'synced'
                            CHECK(status IN ('synced','pending','conflict'))
      );

      CREATE TABLE IF NOT EXISTS pending_entries (
        scope           TEXT NOT NULL,
        entry_id        TEXT NOT NULL,
        local_timestamp TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','synced','failed')),
        retry_count     INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (scope, entry_id)
      );

      CREATE INDEX IF NOT EXISTS idx_pending_scope
        ON pending_entries(scope, status);
    `);
  }

  // ─── Mark an entry as pending (called after local insert) ────────

  markPending(scope: string, entryId: string): void {
    const entry = this.store.getById(entryId);
    if (!entry) {
      throw new Error(`Cannot mark pending: entry ${entryId} not found`);
    }

    this.db
      .prepare(
        `INSERT INTO pending_entries (scope, entry_id, local_timestamp, status)
         VALUES (?, ?, ?, 'pending')
         ON CONFLICT(scope, entry_id) DO UPDATE SET
           status = 'pending',
           retry_count = 0,
           local_timestamp = excluded.local_timestamp`,
      )
      .run(scope, entryId, entry.timestamp);
  }

  // ─── Push: send pending local entries to relay ───────────────────

  async push(scope: string): Promise<{
    results: PendingResult[];
    error: string | null;
  }> {
    const pending = this.db
      .prepare(
        "SELECT * FROM pending_entries WHERE scope = ? AND status = 'pending' ORDER BY local_timestamp ASC",
      )
      .all(scope) as Record<string, unknown>[];

    if (pending.length === 0) {
      return { results: [], error: null };
    }

    const entries: ContextEntry[] = [];
    for (const row of pending) {
      const entry = this.store.getById((row as { entry_id: string }).entry_id);
      if (entry) entries.push(entry);
    }

    let results: PendingResult[];
    try {
      const pushResults = await this.relay.push(scope, entries);
      results = pushResults.map((pr) => ({
        entryId: pr.id,
        status: pr.status as PendingResult["status"],
      }));

      // Update pending status based on relay response
      const updateStmt = this.db.prepare(
        "UPDATE pending_entries SET status = ?, retry_count = retry_count + 1 WHERE scope = ? AND entry_id = ?",
      );
      for (const pr of pushResults) {
        const newStatus = pr.status === "accepted" || pr.status === "duplicate"
          ? "synced"
          : pr.status === "conflict"
            ? "synced" // conflict entries are still synced
            : "failed";
        updateStmt.run(newStatus, scope, pr.id);
      }
    } catch (err) {
      return {
        results: pending.map((r) => ({
          entryId: (r as { entry_id: string }).entry_id,
          status: "failed" as const,
        })),
        error: `Push failed: ${(err as Error).message}`,
      };
    }

    // Don't update sync state here — push tracks pending entries,
      // pull tracks the sync cursor. Updating after push would advance
      // the cursor past entries from other agents that we haven't pulled yet.

    return { results, error: null };
  }

  // ─── Pull: fetch new entries from relay and insert locally ──────

  async pull(scope: string): Promise<{
    pulled: number;
    conflicts: Conflict[];
    error: string | null;
  }> {
    const state = this.getSyncState(scope);
    const sinceEntryId = state?.lastEntryId ?? undefined;
    const sinceTimestamp = state?.lastSyncTimestamp ?? undefined;

    let pullResult;
    try {
      pullResult = await this.relay.pull(scope, { sinceEntryId, sinceTimestamp });
    } catch (err) {
      return { pulled: 0, conflicts: [], error: `Pull failed: ${(err as Error).message}` };
    }

    if (pullResult.entries.length === 0) {
      return { pulled: 0, conflicts: [], error: null };
    }

    const conflicts: Conflict[] = [];
    let inserted = 0;

    for (const entry of pullResult.entries) {
      const existing = this.store.getById(entry.id);
      if (existing) continue;

      const insertEntry: InsertEntry = {
        cid: entry.cid,
        message: entry.message,
        kind: entry.kind,
        scope: entry.scope,
        author: entry.author,
        supersedes: entry.supersedes ?? undefined,
        parents: entry.parents,
      };

      const result = this.store.insert(insertEntry);
      inserted++;

      // If the store's insert produced a conflict AND the relay already
      // flagged one, it's a real divergence.
      if (result.conflict) {
        conflicts.push(result.conflict);
      }
    }

    // Update sync state
    this.upsertSyncState(
      scope,
      pullResult.latestTimestamp ?? isoNow(),
      pullResult.latestEntryId ?? "",
      conflicts.length > 0 ? "conflict" : "synced",
    );

    // Invalidate compiler cache for this scope
    this.compiler.invalidateScope(scope);

    return { pulled: inserted, conflicts, error: null };
  }

  // ─── Full sync: push + pull ─────────────────────────────────────

  async sync(scope: string, options?: { pushOnly?: boolean; pullOnly?: boolean }): Promise<SyncSummary> {
    const errors: SyncSummary["errors"] = [];
    const conflicts: Conflict[] = [];

    // Phase 1: Push
    let pushResults: PendingResult[] = [];
    if (!options?.pullOnly) {
      const pushResult = await this.push(scope);
      pushResults = pushResult.results;
      if (pushResult.error) {
        errors.push({ entryId: "", code: "PUSH_FAILED", message: pushResult.error });
      }
    }

    // Phase 2: Pull
    let pulled = 0;
    if (!options?.pushOnly) {
      const pullResult = await this.pull(scope);
      pulled = pullResult.pulled;
      conflicts.push(...pullResult.conflicts);
      if (pullResult.error) {
        errors.push({ entryId: "", code: "PULL_FAILED", message: pullResult.error });
      }
    }

    return {
      scope,
      pushed: pushResults,
      pulled,
      conflicts,
      errors,
    };
  }

  // ─── Sync state helpers ─────────────────────────────────────────

  getSyncState(scope: string): SyncState | null {
    const row = this.db
      .prepare("SELECT * FROM sync_state WHERE scope = ?")
      .get(scope) as Record<string, unknown> | undefined;
    return row ? rowToSyncState(row) : null;
  }

  private upsertSyncState(scope: string, timestamp: string, entryId: string, status: SyncState["status"]): void {
    this.db
      .prepare(
        `INSERT INTO sync_state (scope, last_sync_timestamp, last_entry_id, status)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET
           last_sync_timestamp = excluded.last_sync_timestamp,
           last_entry_id = excluded.last_entry_id,
           status = excluded.status`,
      )
      .run(scope, timestamp, entryId, status);
  }

  getPendingCount(scope: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM pending_entries WHERE scope = ? AND status = 'pending'")
      .get(scope) as { count: number };
    return row.count;
  }

  getAllPending(scope: string): PendingEntry[] {
    return (this.db
      .prepare("SELECT * FROM pending_entries WHERE scope = ? ORDER BY local_timestamp ASC")
      .all(scope) as Record<string, unknown>[]).map(rowToPending);
  }
}