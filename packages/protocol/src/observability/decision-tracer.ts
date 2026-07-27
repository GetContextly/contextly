import { Store } from "../store.js";
import { Compiler } from "../compiler.js";
import type { ContextEntry } from "../types.js";
import type { CompiledContext, DropRecord } from "../compiler-types.js";
import { AuditLog } from "./audit-log.js";
import type {
  AuditEvent,
  DecisionTrace,
  EnhancedProvenance,
  ExplainResult,
  TraceStep,
} from "./types.js";

export class DecisionTracer {
  constructor(
    private store: Store,
    private compiler: Compiler,
    private auditLog: AuditLog,
  ) {}

  traceEntry(entryId: string, compiledContext?: CompiledContext): DecisionTrace {
    const rootEntry = this.store.getById(entryId);
    if (!rootEntry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    const compiledIn: string[] = [];
    const droppedBy: DropRecord[] = [];

    if (compiledContext) {
      for (const ce of compiledContext.entries) {
        compiledIn.push(ce.entry.id);
      }
      droppedBy.push(...compiledContext.dropped);
    } else {
      const scope = rootEntry.scope;
      const ctx = this.compiler.compile({ scope, budget: Infinity });
      for (const ce of ctx.entries) {
        compiledIn.push(ce.entry.id);
      }
      droppedBy.push(...ctx.dropped);
    }

    const fullAncestry = this.buildAncestryTree(rootEntry);
    const auditEvents = this.findRelatedAuditEvents(rootEntry);

    return { rootEntry, compiledIn, droppedBy, fullAncestry, auditEvents };
  }

  traceCompiledContext(compiled: CompiledContext): DecisionTrace[] {
    return compiled.entries.map((ce) => this.traceEntry(ce.entry.id, compiled));
  }

  explain(id: string): ExplainResult {
    const entry = this.store.getById(id);
    if (!entry) throw new Error(`Entry ${id} not found`);

    const supersessionChain = this.store.getFullSupersessionChain(entry.cid, entry.scope);
    const parentDag = this.store.getAncestors(id);
    const descendants = this.store.getDescendants(id);

    const resolutionEvents = this.auditLog.query({
      scopes: [entry.scope],
      types: ["conflict.auto_resolved", "conflict.manual_resolved"],
    });

    const provenance = this.buildProvenance(entry);

    return { entry, supersessionChain, parentDag, descendants, resolutionEvents, provenance };
  }

  whyDropped(cid: string, scope: string): {
    entry: ContextEntry | null;
    compiledContext: CompiledContext | null;
    reason: string;
    ancestorEntries: ContextEntry[];
  } {
    const compiled = this.compiler.compile({ scope, budget: Infinity });
    const drop = compiled.dropped.find((d) => d.cid === cid);
    const activeEntries = this.store.getByScopeAndCid(scope, cid);
    const history = this.store.getHistory(scope, cid);
    const ancestors = history.length > 0 ? this.store.getAncestors(history[history.length - 1].id) : [];

    if (!drop) {
      const stillPresent = compiled.entries.find((ce) => ce.entry.cid === cid);
      if (stillPresent) {
        return {
          entry: stillPresent.entry,
          compiledContext: compiled,
          reason: "Entry is present in compiled context — not dropped.",
          ancestorEntries: ancestors,
        };
      }
      return {
        entry: activeEntries[0] ?? null,
        compiledContext: compiled,
        reason: "Entry not found in compiled context and no drop record exists. It may have been filtered by kind or cid filter.",
        ancestorEntries: ancestors,
      };
    }

    return {
      entry: activeEntries[0] ?? null,
      compiledContext: compiled,
      reason: `Dropped due to: ${drop.reason}. Message: "${drop.message}"`,
      ancestorEntries: ancestors,
    };
  }

  private buildAncestryTree(entry: ContextEntry): TraceStep[] {
    const steps: TraceStep[] = [];
    const visited = new Set<string>();

    const walk = (e: ContextEntry, how: TraceStep["howReached"]): TraceStep | null => {
      if (visited.has(e.id)) return null;
      visited.add(e.id);

      const children: TraceStep[] = [];

      const supersededBy = this.store.getDescendants(e.id);
      for (const child of supersededBy) {
        const childStep = walk(child, "superseded");
        if (childStep) children.push(childStep);
      }

      const parents = e.parents.map((pid) => this.store.getById(pid)).filter(Boolean) as ContextEntry[];
      for (const parent of parents) {
        const parentStep = walk(parent, "parent");
        if (parentStep) children.push(parentStep);
      }

      let resolutionRule: { name: string; reason: string } | undefined;

      if (e.supersedes) {
        const target = this.store.getById(e.supersedes);
        if (target && target.author.startsWith("human:") && e.author.startsWith("human:")) {
          resolutionRule = { name: "authority", reason: "Human resolution" };
        }
      }

      return {
        entry: e,
        howReached: how,
        resolutionRule,
        children,
      };
    };

    const root = walk(entry, "original");
    if (root) steps.push(root);

    return steps;
  }

  private findRelatedAuditEvents(entry: ContextEntry): AuditEvent[] {
    const scope = entry.scope;

    const insertEvents = this.auditLog.query({
      scopes: [scope],
      types: ["entry.insert", "conflict.detected", "entry.supersede", "conflict.auto_resolved", "conflict.manual_resolved"],
      limit: 100,
    });

    const entryIds = new Set<string>();
    const history = this.store.getHistory(scope, entry.cid);
    for (const e of history) entryIds.add(e.id);

    const relatedAuditEvents: AuditEvent[] = [];
    for (const event of insertEvents) {
      const entryId = event.details?.entryId as string | undefined;
      const existingId = event.details?.existingEntryId as string | undefined;
      const incomingId = event.details?.incomingEntryId as string | undefined;
      const supersededId = event.details?.supersededId as string | undefined;
      if (
        (entryId && entryIds.has(entryId)) ||
        (existingId && entryIds.has(existingId)) ||
        (incomingId && entryIds.has(incomingId)) ||
        (supersededId && entryIds.has(supersededId))
      ) {
        relatedAuditEvents.push(event);
      }
    }

    return relatedAuditEvents;
  }

  private buildProvenance(entry: ContextEntry): EnhancedProvenance | null {
    try {
      const compiled = this.compiler.compile({ scope: entry.scope, cid: entry.cid });
      for (const ce of compiled.entries) {
        if (ce.entry.id === entry.id) {
          const base = ce.provenance;
          const events = this.findRelatedAuditEvents(entry);
          return {
            sourceScope: base.sourceScope,
            inherited: base.inherited,
            fromParent: base.fromParent,
            supersedesChain: base.supersedesChain,
            syncOrigin: base.inherited ? "inherited" : "local",
            auditEventIds: events.map((e) => e.id),
          };
        }
      }
      const events = this.findRelatedAuditEvents(entry);
      return {
        sourceScope: entry.scope,
        inherited: false,
        fromParent: null,
        supersedesChain: [],
        syncOrigin: "local",
        auditEventIds: events.map((e) => e.id),
      };
    } catch {
      return null;
    }
  }
}