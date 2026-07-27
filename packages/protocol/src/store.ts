import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import {
  type Conflict,
  type ContextEntry,
  type EntryKind,
  type EntryStatus,
  type InsertEntry,
  type InsertResult,
  StoreError,
} from "./types";

export function computeId(scope: string, cid: string, message: string): string {
  const hash = createHash("sha256")
    .update(`${scope}.${cid}.${message}`)
    .digest("hex");
  return `sha256:${hash}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

const VALID_KINDS: EntryKind[] = ["decision", "rule", "observation"];

function coerceParents(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToEntry(row: Record<string, unknown>): ContextEntry {
  return {
    id: row.id as string,
    cid: row.cid as string,
    message: row.message as string,
    kind: row.kind as EntryKind,
    scope: row.scope as string,
    author: row.author as string,
    timestamp: row.timestamp as string,
    parents: coerceParents(row.parents),
    supersedes: (row.supersedes as string) ?? null,
    status: row.status as EntryStatus,
  };
}

export class Store {
  private db: Database.Database;

  constructor(path: string = ":memory:") {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id          TEXT PRIMARY KEY,
        cid         TEXT NOT NULL,
        message     TEXT NOT NULL,
        kind        TEXT NOT NULL CHECK(kind IN ('decision','rule','observation')),
        scope       TEXT NOT NULL,
        author      TEXT NOT NULL,
        timestamp   TEXT NOT NULL,
        parents     TEXT NOT NULL DEFAULT '[]',
        supersedes  TEXT,
        status      TEXT NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active','superseded','archived','tombstoned')),
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_active
        ON entries(scope, cid, timestamp DESC) WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_scope_active
        ON entries(scope, timestamp DESC) WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_supersedes
        ON entries(supersedes) WHERE supersedes IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_history
        ON entries(scope, cid, timestamp DESC);
    `);
  }

  // ---------------------------------------------------------------------------
  // Insert
  // ---------------------------------------------------------------------------

  insert(input: InsertEntry): InsertResult {
    if (!VALID_KINDS.includes(input.kind)) {
      throw new StoreError("INVALID_KIND", `Invalid kind: ${input.kind}`);
    }

    const id = computeId(input.scope, input.cid, input.message);
    const now = isoNow();

    const txn = this.db.transaction((): InsertResult => {
      // 1. Duplicate check
      const existing = this.db
        .prepare("SELECT id FROM entries WHERE id = ?")
        .get(id);
      if (existing) {
        throw new StoreError(
          "DUPLICATE_ENTRY",
          `Entry with id ${id} already exists`,
        );
      }

      // 2. Supersedes validation
      const supersedes = input.supersedes ?? null;
      if (supersedes !== null) {
        if (supersedes === id) {
          throw new StoreError(
            "SELF_SUPERSEDE",
            "An entry cannot supersede itself",
          );
        }

        const target = this.db
          .prepare("SELECT id, status, cid, scope FROM entries WHERE id = ?")
          .get(supersedes) as
          | { id: string; status: string; cid: string; scope: string }
          | undefined;
        if (!target) {
          throw new StoreError(
            "SUPERSEDES_TARGET_NOT_FOUND",
            `Supersedes target ${supersedes} does not exist`,
          );
        }

        if (target.status === "superseded") {
          throw new StoreError(
            "SUPERSEDES_TARGET_ALREADY_SUPERSEDED",
            `Supersedes target ${supersedes} is already superseded`,
          );
        }

        // 2a. Cycle detection (defense-in-depth — see DEVIATIONS.md)
        this.assertNoCycle(id, supersedes);
      }

      // 3. Insert the entry
      const parentsJson = JSON.stringify(input.parents ?? []);
      this.db
        .prepare(
          `INSERT INTO entries (id, cid, message, kind, scope, author, timestamp, parents, supersedes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        )
        .run(
          id,
          input.cid,
          input.message,
          input.kind,
          input.scope,
          input.author,
          now,
          parentsJson,
          supersedes,
        );

      // 4. If superseding, mark target as superseded
      if (supersedes !== null) {
        this.db
          .prepare("UPDATE entries SET status = 'superseded' WHERE id = ?")
          .run(supersedes);
      }

      // 5. Build the result entry
      const entry: ContextEntry = {
        id,
        cid: input.cid,
        message: input.message,
        kind: input.kind,
        scope: input.scope,
        author: input.author,
        timestamp: now,
        parents: input.parents ?? [],
        supersedes,
        status: "active",
      };

      // 6. Conflict detection
      const conflict = this.detectConflict(entry);

      return { entry, conflict };
    });

    return txn();
  }

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------

  getById(id: string): ContextEntry | null {
    const row = this.db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
    if (!row) return null;
    return rowToEntry(row as Record<string, unknown>);
  }

  getByScopeAndCid(scope: string, cid: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM entries
         WHERE scope = ? AND cid = ? AND status = 'active'
         ORDER BY timestamp DESC, rowid DESC`,
      )
      .all(scope, cid);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  getActiveSet(scope: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        `SELECT e.* FROM entries e
         WHERE e.scope = ? AND e.status = 'active'
         AND e.id = (
           SELECT e2.id FROM entries e2
           WHERE e2.scope = e.scope
             AND e2.cid = e.cid
             AND e2.status = 'active'
           ORDER BY e2.timestamp DESC, e2.rowid DESC
           LIMIT 1
         )
         ORDER BY e.kind, e.cid`,
      )
      .all(scope);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  getHistory(scope: string, cid: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM entries WHERE scope = ? AND cid = ? ORDER BY timestamp DESC, rowid DESC",
      )
      .all(scope, cid);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  getAllEntries(): ContextEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM entries ORDER BY timestamp ASC, rowid ASC")
      .all();
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  // ---------------------------------------------------------------------------
  // DAG Traversal
  // ---------------------------------------------------------------------------

  getAncestors(id: string): ContextEntry[] {
    const entries: ContextEntry[] = [];
    const visited = new Set<string>();
    let current: ContextEntry | null = this.getById(id);
    while (current) {
      visited.add(current.id);
      // Follow supersedes first (the primary edge type)
      if (current.supersedes && !visited.has(current.supersedes)) {
        current = this.getById(current.supersedes);
        if (current) entries.push(current);
        continue;
      }
      // Then follow parents
      let foundParent = false;
      for (const pid of current.parents) {
        if (!visited.has(pid)) {
          const parent = this.getById(pid);
          if (parent) {
            entries.push(parent);
            current = parent;
            foundParent = true;
            break;
          }
        }
      }
      if (!foundParent) break;
    }
    return entries;
  }

  getDescendants(id: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM entries WHERE supersedes = ? ORDER BY timestamp ASC",
      )
      .all(id);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  getFullSupersessionChain(cid: string, scope: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM entries WHERE cid = ? AND scope = ? ORDER BY timestamp ASC, rowid ASC",
      )
      .all(cid, scope);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle transitions
  // ---------------------------------------------------------------------------

  archiveEntry(id: string): void {
    const result = this.db
      .prepare(
        "UPDATE entries SET status = 'archived' WHERE id = ? AND status = 'active'",
      )
      .run(id);
    if (result.changes === 0) {
      const entry = this.getById(id);
      if (!entry) {
        throw new StoreError("SUPERSEDES_TARGET_NOT_FOUND", `Entry ${id} not found`);
      }
      if (entry.status !== "active") {
        throw new StoreError(
          "INVALID_STATUS",
          `Cannot archive entry ${id} with status '${entry.status}' — only active entries can be archived`,
        );
      }
    }
  }

  tombstoneEntry(id: string): void {
    const entry = this.getById(id);
    if (!entry) {
      throw new StoreError("SUPERSEDES_TARGET_NOT_FOUND", `Entry ${id} not found`);
    }
    if (entry.status !== "active") {
      throw new StoreError(
        "INVALID_STATUS",
        `Cannot tombstone entry ${id} with status '${entry.status}' — only active entries can be tombstoned`,
      );
    }
    this.db
      .prepare(
        "UPDATE entries SET status = 'tombstoned', message = '' WHERE id = ?",
      )
      .run(id);
  }

  // ---------------------------------------------------------------------------
  // Conflict detection
  // ---------------------------------------------------------------------------

  private detectConflict(entry: ContextEntry): Conflict | null {
    const active = this.db
      .prepare(
        `SELECT * FROM entries
         WHERE scope = ? AND cid = ? AND status = 'active' AND id != ?
         ORDER BY timestamp DESC`,
      )
      .all(entry.scope, entry.cid, entry.id) as Record<string, unknown>[];

    for (const row of active) {
      const existing = rowToEntry(row);
      if (existing.message !== entry.message) {
        // Check if one supersedes the other
        const newSupersedesOld =
          entry.supersedes === existing.id;
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
    return null;
  }

  getConflicts(scope: string): Conflict[] {
    const activeEntries = this.db
      .prepare(
        "SELECT * FROM entries WHERE scope = ? AND status = 'active' ORDER BY cid, timestamp DESC",
      )
      .all(scope) as Record<string, unknown>[];

    const grouped = new Map<string, ContextEntry[]>();
    for (const row of activeEntries) {
      const entry = rowToEntry(row);
      const key = `${entry.scope}:${entry.cid}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(entry);
    }

    const conflicts: Conflict[] = [];
    for (const [, entries] of grouped) {
      if (entries.length < 2) continue;
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          if (a.message !== b.message) {
            const aSupersedesB = a.supersedes === b.id;
            const bSupersedesA = b.supersedes === a.id;
            if (!aSupersedesB && !bSupersedesA) {
              conflicts.push({
                scope,
                cid: a.cid,
                existingEntry: a,
                incomingEntry: b,
              });
            }
          }
        }
      }
    }
    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Raw active scan (for the Compiler — returns all active entries, no dedup)
  // ---------------------------------------------------------------------------

  getAllActiveForScope(scope: string): ContextEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM entries WHERE scope = ? AND status = 'active' ORDER BY timestamp DESC, rowid DESC",
      )
      .all(scope);
    return (rows as Record<string, unknown>[]).map(rowToEntry);
  }

  // ---------------------------------------------------------------------------
  // Cycle detection (defense-in-depth)
  // ---------------------------------------------------------------------------

  private assertNoCycle(newId: string, supersedesTarget: string): void {
    const visited = new Set<string>([newId]);
    let current: string | null = supersedesTarget;
    while (current !== null) {
      if (visited.has(current)) {
        throw new StoreError(
          "CYCLE_DETECTED",
          `Supersession cycle detected: ${newId} → ... → ${current} → ... → ${newId}`,
        );
      }
      visited.add(current);
      const entry = this.db
        .prepare("SELECT supersedes FROM entries WHERE id = ?")
        .get(current) as { supersedes: string | null } | undefined;
      current = entry?.supersedes ?? null;
    }
  }

  // ---------------------------------------------------------------------------
  // Multi-tenant isolation
  // ---------------------------------------------------------------------------

  scopeExists(scope: string): boolean {
    const row = this.db
      .prepare("SELECT 1 FROM entries WHERE scope = ? LIMIT 1")
      .get(scope);
    return row !== undefined;
  }

  getScopes(): string[] {
    const rows = this.db
      .prepare("SELECT DISTINCT scope FROM entries ORDER BY scope")
      .all() as { scope: string }[];
    return rows.map((r) => r.scope);
  }

  deleteScope(scope: string): number {
    const result = this.db
      .prepare("DELETE FROM entries WHERE scope = ?")
      .run(scope);
    return result.changes;
  }
}