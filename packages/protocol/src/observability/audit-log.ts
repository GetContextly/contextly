import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import type { AuditEvent, AuditEventType } from "./types.js";

function isoNow(): string {
  return new Date().toISOString();
}

function computeAuditId(type: AuditEventType, scope: string, seq: number): string {
  const hash = createHash("sha256")
    .update(`audit:${type}:${scope}:${seq}:${isoNow()}`)
    .digest("hex");
  return `audit:${hash}`;
}

export class AuditLog {
  private db: Database.Database;
  private seq: number = 0;

  constructor(db: Database.Database) {
    this.db = db;
    this.initTables();
    this.seq = this.loadSeq();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id          TEXT PRIMARY KEY,
        seq         INTEGER NOT NULL,
        type        TEXT NOT NULL,
        scope       TEXT NOT NULL,
        actor       TEXT NOT NULL,
        details     TEXT NOT NULL DEFAULT '{}',
        timestamp   TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_log(type);
      CREATE INDEX IF NOT EXISTS idx_audit_scope ON audit_log(scope);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_scope_type ON audit_log(scope, type);
      CREATE INDEX IF NOT EXISTS idx_audit_scope_time ON audit_log(scope, timestamp);
    `);
  }

  private loadSeq(): number {
    const row = this.db
      .prepare("SELECT MAX(seq) as max_seq FROM audit_log")
      .get() as { max_seq: number | null };
    return (row?.max_seq ?? 0) + 1;
  }

  record(type: AuditEventType, scope: string, actor: string, details?: Record<string, unknown>): AuditEvent {
    const seq = this.seq++;
    const id = computeAuditId(type, scope, seq);
    const timestamp = isoNow();

    this.db
      .prepare(
        `INSERT INTO audit_log (id, seq, type, scope, actor, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, seq, type, scope, actor, JSON.stringify(details ?? {}), timestamp);

    return { id, timestamp, type, scope, actor, details: details ?? {} };
  }

  query(options: {
    scopes?: string[];
    types?: AuditEventType[];
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
  }): AuditEvent[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.scopes && options.scopes.length > 0) {
      conditions.push(`scope IN (${options.scopes.map(() => "?").join(",")})`);
      params.push(...options.scopes);
    }
    if (options.types && options.types.length > 0) {
      conditions.push(`type IN (${options.types.map(() => "?").join(",")})`);
      params.push(...options.types);
    }
    if (options.since) {
      conditions.push("timestamp >= ?");
      params.push(options.since);
    }
    if (options.until) {
      conditions.push("timestamp <= ?");
      params.push(options.until);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = options.limit ?? 1000;
    const offset = options.offset ?? 0;

    const rows = this.db
      .prepare(
        `SELECT * FROM audit_log ${where} ORDER BY seq ASC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: r.id as string,
      timestamp: r.timestamp as string,
      type: r.type as AuditEventType,
      scope: r.scope as string,
      actor: r.actor as string,
      details: JSON.parse(r.details as string) as Record<string, unknown>,
    }));
  }

  count(options: {
    scopes?: string[];
    types?: AuditEventType[];
    since?: string;
    until?: string;
  }): number {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.scopes && options.scopes.length > 0) {
      conditions.push(`scope IN (${options.scopes.map(() => "?").join(",")})`);
      params.push(...options.scopes);
    }
    if (options.types && options.types.length > 0) {
      conditions.push(`type IN (${options.types.map(() => "?").join(",")})`);
      params.push(...options.types);
    }
    if (options.since) {
      conditions.push("timestamp >= ?");
      params.push(options.since);
    }
    if (options.until) {
      conditions.push("timestamp <= ?");
      params.push(options.until);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const row = this.db
      .prepare(`SELECT COUNT(*) as count FROM audit_log ${where}`)
      .get(...params) as { count: number };

    return row.count;
  }

  getByScope(scope: string, limit?: number): AuditEvent[] {
    return this.query({ scopes: [scope], limit });
  }

  getByType(type: AuditEventType, limit?: number): AuditEvent[] {
    return this.query({ types: [type], limit });
  }

  getScopes(): string[] {
    const rows = this.db
      .prepare("SELECT DISTINCT scope FROM audit_log ORDER BY scope")
      .all() as Array<{ scope: string }>;
    return rows.map((r) => r.scope);
  }

  clear(): void {
    this.db.exec("DELETE FROM audit_log");
    this.seq = 1;
  }

  getRecentEvents(scope: string, windowMs: number): AuditEvent[] {
    const since = new Date(Date.now() - windowMs).toISOString();
    return this.query({ scopes: [scope], since, limit: 10000 });
  }
}