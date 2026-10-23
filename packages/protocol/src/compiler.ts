import { Store } from "./store";
import { type Conflict, type ContextEntry, type EntryKind } from "./types";
import {
  type CacheEntry,
  type CompiledContext,
  type CompiledEntry,
  type CompilerOptions,
  type DropRecord,
  type Provenance,
} from "./compiler-types";

const KIND_PRIORITY: Record<EntryKind, number> = {
  rule: 0,
  decision: 1,
  observation: 2,
};

function tokenCount(text: string): number {
  let count = 0;
  for (const word of text.split(/\s+/)) {
    if (word.length === 0) continue;
    count += Math.max(1, Math.ceil(word.length / 4));
  }
  return count;
}

function entryTokenCount(e: ContextEntry): number {
  return tokenCount(e.message) + tokenCount(e.cid) + 3;
}

function parseScopeAncestors(scope: string): string[] {
  const parts = scope.split(".");
  const ancestors: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("."));
  }
  return ancestors;
}

interface DedupResult {
  survivors: ContextEntry[];
  conflicts: Conflict[];
  overridden: number;
  inherited: number;
  provenances: Map<string, Provenance>;
}

export class Compiler {
  private cache: Map<string, CacheEntry> = new Map();
  private scopeVersions: Map<string, number> = new Map();

  constructor(private store: Store) {}

  invalidateScope(scope: string): void {
    const current = this.scopeVersions.get(scope) ?? 0;
    this.scopeVersions.set(scope, current + 1);
    for (const [key] of this.cache) {
      if (key.startsWith(`${scope}|`)) {
        this.cache.delete(key);
      }
    }
    for (const ancestor of parseScopeAncestors(scope)) {
      if (ancestor !== scope) {
        this.invalidateScope(ancestor);
      }
    }
  }

  compile(options: CompilerOptions): CompiledContext {
    const budget = options.budget ?? Infinity;
    const cacheKey = `${options.scope}|${budget}|${options.kind ?? "*"}|${options.cid ?? "*"}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      const currentVersion = this.scopeVersions.get(options.scope) ?? 0;
      if (cached.scopeVersion === currentVersion) {
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    const result = this.compileInner(options);

    this.cache.set(cacheKey, {
      result,
      scopeVersion: this.scopeVersions.get(options.scope) ?? 0,
    });

    return result;
  }

  private compileInner(options: CompilerOptions): CompiledContext {
    const { scope, kind, cid, budget: rawBudget, task } = options;
    const budget = rawBudget ?? Infinity;
    const ancestors = parseScopeAncestors(scope);

    // ── Pass 1+4: Scope resolution + inheritance ──────────────────────
    // Collect ALL active entries per scope (allow conflicts within scope)
    const scopeToEntries = new Map<string, ContextEntry[]>();
    for (const s of ancestors) {
      scopeToEntries.set(s, this.store.getAllActiveForScope(s));
    }

    // For each cid, find the deepest scope that has it
    const deepestScopeForCid = new Map<string, number>();
    for (let i = 0; i < ancestors.length; i++) {
      for (const e of scopeToEntries.get(ancestors[i])!) {
        deepestScopeForCid.set(e.cid, i);
      }
    }

    // Collect all entries from the deepest scope per cid
    const allEntries: ContextEntry[] = [];
    for (let i = 0; i < ancestors.length; i++) {
      const s = ancestors[i];
      for (const e of scopeToEntries.get(s)!) {
        if (deepestScopeForCid.get(e.cid) === i) {
          allEntries.push(e);
        }
      }
    }

    // Track inherited vs overridden
    const directEntryCids = new Set(
      this.store
        .getAllActiveForScope(scope)
        .map((e) => e.cid),
    );

    let inherited = 0;
    const overridden = new Set<string>();
    for (const entry of allEntries) {
      const isFromParent = entry.scope !== scope;
      if (isFromParent) {
        inherited++;
      }
      if (directEntryCids.has(entry.cid) && isFromParent) {
        overridden.add(entry.cid);
      }
    }

    // ── Pass 2+3: Status filter (already active) + CID dedup ──────────
    const dedup = this.deduplicateAndDetectConflicts(allEntries, scope);

    // ── Pass 5: Ordering ──────────────────────────────────────────────
    const sorted = [...dedup.survivors].sort((a, b) => {
      const ka = KIND_PRIORITY[a.kind] ?? 99;
      const kb = KIND_PRIORITY[b.kind] ?? 99;
      if (ka !== kb) return ka - kb;
      return a.cid.localeCompare(b.cid);
    });

    // ── Task relevance ranking (optional) ─────────────────────────────
    let ranked = sorted;
    if (task) {
      ranked = this.rankByRelevance(sorted, task);
    }

    // ── Kind/cid filter ───────────────────────────────────────────────
    let filtered = ranked;
    if (kind) {
      filtered = filtered.filter((e) => e.kind === kind);
    }
    if (cid) {
      const pattern = cid.endsWith("*") ? cid.slice(0, -1) : null;
      filtered = filtered.filter((e) =>
        pattern ? e.cid.startsWith(pattern) : e.cid === cid,
      );
    }

    // ── Token budget ──────────────────────────────────────────────────
    const { entries: budgeted, dropped, compressed } = this.applyBudget(filtered, budget);

    // ── Build compiled entries with provenance ───────────────────────
    const compiled: CompiledEntry[] = budgeted.map((entry) => {
      const prov = dedup.provenances.get(entry.id) ?? {
        sourceScope: scope,
        inherited: false,
        fromParent: null,
        supersedesChain: [],
      };
      const chain = this.buildSupersedesChain(entry);
      return {
        entry,
        provenance: { ...prov, supersedesChain: chain },
      };
    });

    const totalTokens = budgeted.reduce((sum, e) => sum + entryTokenCount(e), 0);

    return {
      entries: compiled,
      conflicts: dedup.conflicts,
      stats: {
        totalActive: allEntries.length,
        inherited,
        overridden: overridden.size,
        conflicts: dedup.conflicts.length,
        dropped: dropped.length,
        compressed,
        tokenCount: totalTokens,
        budget: budget === Infinity ? 0 : budget,
      },
      dropped,
    };
  }

  private deduplicateAndDetectConflicts(
    entries: ContextEntry[],
    scope: string,
  ): DedupResult {
    const byCid = new Map<string, ContextEntry[]>();
    for (const entry of entries) {
      if (!byCid.has(entry.cid)) byCid.set(entry.cid, []);
      byCid.get(entry.cid)!.push(entry);
    }

    const survivors: ContextEntry[] = [];
    const conflicts: Conflict[] = [];
    const provenances = new Map<string, Provenance>();

    for (const [cid, group] of byCid) {
      if (group.length === 1) {
        const entry = group[0];
        survivors.push(entry);
        provenances.set(entry.id, {
          sourceScope: entry.scope,
          inherited: entry.scope !== scope,
          fromParent: entry.scope !== scope ? entry.scope : null,
          supersedesChain: [],
        });
        continue;
      }

      // Multiple entries for same cid — resolve via supersession
      const active = group.filter((e) => e.status === "active");
      if (active.length <= 1) {
        survivors.push(active[0]);
        continue;
      }

      // Check supersession relationships
      const superseder = new Map<string, ContextEntry>();
      const superseded = new Set<string>();
      for (const entry of active) {
        if (entry.supersedes) {
          const target = active.find((e) => e.id === entry.supersedes);
          if (target) {
            superseder.set(target.id, entry);
            superseded.add(target.id);
          }
        }
      }

      // Walk the supersession chain to find the active head
      let heads = active.filter((e) => !superseded.has(e.id));
      if (heads.length === 0) {
        heads = [active[active.length - 1]];
      }

      if (heads.length === 1) {
        survivors.push(heads[0]);
        provenances.set(heads[0].id, {
          sourceScope: heads[0].scope,
          inherited: heads[0].scope !== scope,
          fromParent: heads[0].scope !== scope ? heads[0].scope : null,
          supersedesChain: [],
        });
      } else {
        // Multiple heads with no supersession → CONFLICT
        for (let i = 0; i < heads.length; i++) {
          for (let j = i + 1; j < heads.length; j++) {
            if (heads[i].message !== heads[j].message) {
              conflicts.push({
                scope,
                cid,
                existingEntry: heads[i],
                incomingEntry: heads[j],
              });
            }
          }
        }
        for (const head of heads) {
          survivors.push(head);
          provenances.set(head.id, {
            sourceScope: head.scope,
            inherited: head.scope !== scope,
            fromParent: head.scope !== scope ? head.scope : null,
            supersedesChain: [],
          });
        }
      }
    }

    return {
      survivors,
      conflicts,
      overridden: 0,
      inherited: 0,
      provenances,
    };
  }

  private buildSupersedesChain(entry: ContextEntry): string[] {
    const chain: string[] = [];
    let current: ContextEntry | null = entry;
    while (current) {
      chain.push(current.id);
      if (current.supersedes) {
        const parent = this.store.getById(current.supersedes);
        if (parent) {
          current = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return chain;
  }

  private rankByRelevance(
    entries: ContextEntry[],
    task: string,
  ): ContextEntry[] {
    const taskWords = new Set(
      task
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2),
    );

    const scored = entries.map((entry) => {
      const messageWords = entry.message.toLowerCase().split(/\W+/);
      const cidWords = entry.cid.toLowerCase().split(/\W+/);
      const matches = [...messageWords, ...cidWords].filter((w) =>
        taskWords.has(w),
      ).length;
      return { entry, score: matches };
    });

    scored.sort((a, b) => {
      // Within same kind, sort by relevance score descending
      const ka = KIND_PRIORITY[a.entry.kind] ?? 99;
      const kb = KIND_PRIORITY[b.entry.kind] ?? 99;
      if (ka !== kb) return ka - kb;
      if (b.score !== a.score) return b.score - a.score;
      return a.entry.cid.localeCompare(b.entry.cid);
    });

    return scored.map((s) => s.entry);
  }

  private applyBudget(
    entries: ContextEntry[],
    budget: number,
  ): { entries: ContextEntry[]; dropped: DropRecord[]; compressed: number } {
    if (budget === Infinity || entries.length === 0) {
      return { entries, dropped: [], compressed: 0 };
    }

    let total = entries.reduce((sum, e) => sum + entryTokenCount(e), 0);
    if (total <= budget) {
      return { entries, dropped: [], compressed: 0 };
    }

    const dropped: DropRecord[] = [];
    let compressed = 0;

    const groups: Record<EntryKind, ContextEntry[]> = {
      rule: [],
      decision: [],
      observation: [],
    };
    for (const e of entries) {
      groups[e.kind].push(e);
    }

    const survive: ContextEntry[] = [];

    // Phase 1: compress observations (shorten messages)
    for (const e of groups.observation) {
      if (total <= budget) {
        survive.push(e);
        continue;
      }
      const before = entryTokenCount(e);
      const compressedMsg = this.compressMessage(e.message);
      const compressedEntry = { ...e, message: compressedMsg };
      const after = entryTokenCount(compressedEntry);
      total -= before - after;
      compressed++;
      survive.push(compressedEntry);
    }

    // Phase 2: compress decisions if still over
    if (total > budget) {
      for (const e of groups.decision) {
        if (total <= budget) {
          survive.push(e);
          continue;
        }
        const before = entryTokenCount(e);
        const compressedMsg = this.compressMessage(e.message);
        const compressedEntry = { ...e, message: compressedMsg };
        const after = entryTokenCount(compressedEntry);
        total -= before - after;
        compressed++;
        survive.push(compressedEntry);
      }
    } else {
      survive.push(...groups.decision);
    }

    // Phase 3: include rules as-is (never compress rules)
    survive.push(...groups.rule);

    // Phase 4: drop observations (lowest priority) if still over
    const finalEntries = [...survive];
    if (total > budget) {
      const obsEntries = finalEntries.filter((e) => e.kind === "observation");
      for (const e of obsEntries) {
        if (total <= budget) break;
        total -= entryTokenCount(e);
        const idx = finalEntries.indexOf(e);
        if (idx !== -1) {
          finalEntries.splice(idx, 1);
          dropped.push({
            cid: e.cid,
            kind: e.kind,
            message: e.message,
            sourceScope: e.scope,
            reason: "budget",
          });
        }
      }
    }

    // Phase 5: drop decisions if still over (never drop rules)
    if (total > budget) {
      const decEntries = finalEntries.filter((e) => e.kind === "decision");
      for (const e of decEntries) {
        if (total <= budget) break;
        total -= entryTokenCount(e);
        const idx = finalEntries.indexOf(e);
        if (idx !== -1) {
          finalEntries.splice(idx, 1);
          dropped.push({
            cid: e.cid,
            kind: e.kind,
            message: e.message,
            sourceScope: e.scope,
            reason: "budget",
          });
        }
      }
    }

    return { entries: finalEntries, dropped, compressed };
  }

  private compressMessage(message: string): string {
    const sentences = message.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1) {
      if (message.length > 80) {
        return message.slice(0, 77) + "...";
      }
      return message;
    }
    return sentences[0];
  }
}

export { parseScopeAncestors, tokenCount, entryTokenCount };