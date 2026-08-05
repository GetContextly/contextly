import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { Store, type Conflict, type ContextEntry } from "../index.js";
import { Compiler } from "../compiler.js";
import type {
  AggregatedConflict,
  AutoResolveResult,
  EscalationPolicy,
  FeedbackRecord,
  ManualResolveInput,
  ResolutionRule,
  ResolutionRuleName,
  ResolverStats,
} from "./types.js";

function isoNow(): string {
  return new Date().toISOString();
}

function computeConflictId(scope: string, cid: string, ids: string[]): string {
  const sorted = [...ids].sort();
  const hash = createHash("sha256")
    .update(`conflict:${scope}:${cid}:${sorted.join(":")}`)
    .digest("hex");
  return `conflict:${hash}`;
}

export function authorityLevel(author: string): number {
  if (author.startsWith("human:")) return 3;
  if (author.startsWith("agent:")) {
    const name = author.slice(6);
    if (name && name !== "anonymous") return 2;
    return 1;
  }
  if (author === "anonymous") return 0;
  return 0;
}

function scopeDepth(scope: string): number {
  return scope.split(".").length;
}

export type ConfidenceFn = (entry: ContextEntry) => number;

export class ConflictResolver {
  private store: Store;
  private compiler: Compiler;
  private db: Database.Database;
  private confidenceFn: ConfidenceFn;

  constructor(
    store: Store,
    compiler: Compiler,
    opts?: { db?: Database.Database; confidenceFn?: ConfidenceFn },
  ) {
    this.store = store;
    this.compiler = compiler;
    this.db = opts?.db ?? store.getDb();
    this.confidenceFn = opts?.confidenceFn ?? (() => 1.0);
    this.initTables();
  }

  /** No-op — the resolver shares the store's database connection. */
  close(): void {}

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS resolver_feedback (
        conflict_id          TEXT PRIMARY KEY,
        auto_resolution_id   TEXT NOT NULL,
        human_override_id    TEXT,
        disagreed            INTEGER NOT NULL DEFAULT 0,
        notes                TEXT,
        recorded_at          TEXT NOT NULL,
        recorded_by          TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auto_resolutions (
        conflict_id          TEXT PRIMARY KEY,
        scope                TEXT NOT NULL,
        cid                  TEXT NOT NULL,
        superseding_id       TEXT NOT NULL,
        superseded_ids       TEXT NOT NULL,
        rule_name            TEXT NOT NULL,
        rule_reason          TEXT NOT NULL,
        resolved_at          TEXT NOT NULL
      );
    `);
  }

  // ─── 1. Detection surface ──────────────────────────────────────

  getConflicts(scope: string): AggregatedConflict[] {
    const seen = new Set<string>();
    const aggregated: AggregatedConflict[] = [];

    for (const c of this.store.getConflicts(scope)) {
      const ids = [c.existingEntry.id, c.incomingEntry.id];
      const id = computeConflictId(c.scope, c.cid, ids);
      if (seen.has(id)) continue;
      seen.add(id);

      aggregated.push({
        id,
        scope: c.scope,
        cid: c.cid,
        type: "divergent",
        source: "store",
        entries: [c.existingEntry, c.incomingEntry],
        detectedAt: isoNow(),
        status: this.resolveStatus(id),
      });
    }

    return aggregated;
  }

  getConflictsForCid(scope: string, cid: string): AggregatedConflict[] {
    return this.getConflicts(scope).filter((c) => c.cid === cid);
  }

  getAllUnresolvedConflicts(scope: string): AggregatedConflict[] {
    return this.getConflicts(scope).filter((c) => c.status === "unresolved");
  }

  // ─── 2. Automated resolution tier ──────────────────────────────

  autoResolve(scope: string): AutoResolveResult {
    const storeConflicts = this.store.getConflicts(scope);
    const grouped = this.groupByCid(storeConflicts);

    const result: AutoResolveResult = {
      scope,
      total: grouped.size,
      resolved: 0,
      skipped: 0,
      resolutions: [],
      skippedConflicts: [],
    };

    for (const [key, entries] of grouped) {
      const [s, c] = key.split(":", 2);
      const conflictId = computeConflictId(
        s,
        c,
        entries.map((e) => e.id),
      );

      if (this.db.prepare("SELECT 1 FROM auto_resolutions WHERE conflict_id = ?").get(conflictId)) {
        result.skipped++;
        result.skippedConflicts.push({ conflictId, cid: c, reason: "Already auto-resolved" });
        continue;
      }

      const outcome = this.pickWinner(entries);
      if (!outcome) {
        result.skipped++;
        result.skippedConflicts.push({
          conflictId,
          cid: c,
          reason: "Cannot determine winner — all rules tied",
        });
        continue;
      }

      const { winner, losers, rule } = outcome;

      // Mark each loser as superseded directly — no new entry needed.
      // The winner remains the sole active entry for this cid.
      for (const loser of losers) {
        this.store.supersedeEntry(loser.id, `agent:resolver:${rule.name}`);
      }

this.db
        .prepare(
          `INSERT INTO auto_resolutions
           (conflict_id, scope, cid, superseding_id, superseded_ids, rule_name, rule_reason, resolved_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          conflictId,
          s,
          c,
          winner.id,
          JSON.stringify(losers.map((l) => l.id)),
          rule.name,
          rule.reason,
          isoNow(),
        );

      result.resolved++;
      result.resolutions.push({
        conflictId,
        cid: c,
        rule,
        supersedingEntryId: winner.id,
        supersededIds: losers.map((l) => l.id),
      });
    }

    this.compiler.invalidateScope(scope);
    return result;
  }

  // ─── 3. Human-in-the-loop tier ─────────────────────────────────

  manualResolve(input: ManualResolveInput): ContextEntry {
    const target = this.store.getById(input.supersedingId);
    if (!target) {
      throw new Error(`Supersedes target ${input.supersedingId} does not exist`);
    }

    const result = this.store.insert({
      scope: input.scope,
      cid: input.cid,
      message: input.message,
      kind: input.kind,
      author: input.author,
      supersedes: input.supersedingId,
    });

    this.compiler.invalidateScope(input.scope);
    return result.entry;
  }

  // ─── 4. Escalation policy ──────────────────────────────────────

  canResolve(author: string, _scope: string, policy?: EscalationPolicy): boolean {
    if (authorityLevel(author) === 0) return false;
    if (authorityLevel(author) >= 3) return true;
    if (!policy) return false;
    return (
      policy.owner.includes(author) ||
      policy.admins.includes(author) ||
      policy.delegates.includes(author)
    );
  }

  // ─── 5. Feedback loop ──────────────────────────────────────────

  recordFeedback(input: Omit<FeedbackRecord, "recordedAt">): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO resolver_feedback
         (conflict_id, auto_resolution_id, human_override_id, disagreed, notes, recorded_at, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.conflictId,
        input.autoResolutionEntryId,
        input.humanOverrideEntryId ?? null,
        input.disagreed ? 1 : 0,
        input.notes ?? null,
        isoNow(),
        input.recordedBy,
      );
  }

  getFeedback(conflictId: string): FeedbackRecord | null {
    const row = this.db
      .prepare("SELECT * FROM resolver_feedback WHERE conflict_id = ?")
      .get(conflictId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      conflictId: row.conflict_id as string,
      autoResolutionEntryId: row.auto_resolution_id as string,
      humanOverrideEntryId: (row.human_override_id as string) ?? undefined,
      disagreed: (row.disagreed as number) === 1,
      notes: (row.notes as string) ?? undefined,
      recordedAt: row.recorded_at as string,
      recordedBy: row.recorded_by as string,
    };
  }

  getStats(scope?: string): ResolverStats {
    const autoRow = this.db
      .prepare(
        scope
          ? "SELECT COUNT(*) as count FROM auto_resolutions WHERE scope = ?"
          : "SELECT COUNT(*) as count FROM auto_resolutions",
      )
      .get(...(scope ? [scope] : [])) as { count: number };

    const feedbackRows = this.db
      .prepare("SELECT disagreed, COUNT(*) as count FROM resolver_feedback GROUP BY disagreed")
      .all() as Array<{ disagreed: number; count: number }>;

    const disagreements = feedbackRows.find((r) => r.disagreed === 1)?.count ?? 0;
    const agreements = feedbackRows.find((r) => r.disagreed === 0)?.count ?? 0;

    const totalConflicts = scope ? this.store.getConflicts(scope).length : 0;
    const unresolved = totalConflicts - autoRow.count;

    return {
      totalConflicts,
      autoResolved: autoRow.count,
      manualResolved: 0,
      unresolved,
      feedbackDisagreements: disagreements,
      feedbackAgreements: agreements,
    };
  }

  // ─── Internals ─────────────────────────────────────────────────

  private groupByCid(conflicts: Conflict[]): Map<string, ContextEntry[]> {
    const grouped = new Map<string, ContextEntry[]>();
    const seenEntries = new Set<string>();
    for (const c of conflicts) {
      const key = `${c.scope}:${c.cid}`;
      if (!grouped.has(key)) grouped.set(key, []);
      for (const e of [c.existingEntry, c.incomingEntry]) {
        if (!seenEntries.has(e.id)) {
          seenEntries.add(e.id);
          grouped.get(key)!.push(e);
        }
      }
    }
    return grouped;
  }

  private pickWinner(
    entries: ContextEntry[],
  ): { winner: ContextEntry; losers: ContextEntry[]; rule: ResolutionRule } | null {
    if (entries.length < 2) return null;

    const authorityScores = entries.map((e) => authorityLevel(e.author));
    const depthScores = entries.map((e) => scopeDepth(e.scope));
    const confScores = entries.map((e) => this.confidenceFn(e));

    const ruleChecks: Array<{
      name: ResolutionRuleName;
      scores: number[];
      reason: (i: number) => string;
    }> = [
      {
        name: "authority",
        scores: authorityScores,
        reason: (i: number) => `${entries[i].author} (level ${authorityScores[i]})`,
      },
      {
        name: "scope_specificity",
        scores: depthScores,
        reason: (i: number) => `${entries[i].scope} (depth ${depthScores[i]})`,
      },
      {
        name: "recency",
        scores: entries.map((e) => new Date(e.timestamp).getTime()),
        reason: (i: number) => entries[i].timestamp,
      },
      {
        name: "confidence",
        scores: confScores,
        reason: (i: number) => `score ${confScores[i]}`,
      },
    ];

    for (const check of ruleChecks) {
      const max = Math.max(...check.scores);
      const winners = entries.filter((_, i) => check.scores[i] === max);
      if (winners.length !== 1) continue;
      const wi = entries.indexOf(winners[0]);
      const losers = entries.filter((_, i) => i !== wi);
      return {
        winner: winners[0],
        losers,
        rule: {
          name: check.name,
          reason: `${check.reason(wi)} > ${losers.map((l) => check.reason(entries.indexOf(l))).join(", ")}`,
        },
      };
    }

    return null;
  }

  private resolveStatus(conflictId: string): AggregatedConflict["status"] {
    const row = this.db
      .prepare("SELECT 1 FROM auto_resolutions WHERE conflict_id = ?")
      .get(conflictId);
    return row ? "auto_resolved" : "unresolved";
  }
}