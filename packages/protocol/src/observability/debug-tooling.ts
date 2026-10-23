import { Store } from "../store.js";
import { Compiler } from "../compiler.js";
import { AuditLog } from "./audit-log.js";
import type { ContextEntry } from "../types.js";
import type { CompiledContext } from "../compiler-types.js";
import type { ExplainResult, WhyDroppedResult, EnhancedProvenance } from "./types.js";

export class DebugTooling {
  constructor(
    private store: Store,
    private compiler: Compiler,
    private auditLog: AuditLog,
  ) {}

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

  whyDropped(cid: string, scope: string): WhyDroppedResult {
    const compiled = this.compiler.compile({ scope, budget: Infinity });
    const drop = compiled.dropped.find((d) => d.cid === cid);
    const activeEntries = this.store.getByScopeAndCid(scope, cid);
    const history = this.store.getHistory(scope, cid);
    const ancestorEntries = history.length > 0
      ? this.store.getAncestors(history[history.length - 1].id)
      : [];

    const entry = activeEntries[0] ?? null;

    if (!drop) {
      const stillPresent = compiled.entries.find((ce) => ce.entry.cid === cid);
      if (stillPresent) {
        return { entry: stillPresent.entry, compiledContext: compiled, reason: null, ancestorEntries };
      }
      return { entry, compiledContext: compiled, reason: null, ancestorEntries };
    }

    return { entry, compiledContext: compiled, reason: drop, ancestorEntries };
  }

  traceScope(scope: string): {
    compiledContext: CompiledContext;
    traces: Array<{
      entry: ContextEntry;
      provenance: EnhancedProvenance | null;
      inCompiled: boolean;
    }>;
  } {
    const compiled = this.compiler.compile({ scope, budget: Infinity });
    const compiledIds = new Set(compiled.entries.map((ce) => ce.entry.id));

    const active = this.store.getAllActiveForScope(scope);
    const traces = active.map((e) => ({
      entry: e,
      provenance: this.buildProvenance(e),
      inCompiled: compiledIds.has(e.id),
    }));

    return { compiledContext: compiled, traces };
  }

  ancestryDag(id: string): string {
    const entry = this.store.getById(id);
    if (!entry) return `Entry ${id} not found`;

    const lines: string[] = [];
    lines.push(`Ancestry DAG for: ${entry.id}`);
    lines.push(`  cid: ${entry.cid}`);
    lines.push(`  scope: ${entry.scope}`);
    lines.push(`  message: ${entry.message}`);
    lines.push(`  author: ${entry.author}`);
    lines.push(`  status: ${entry.status}`);
    lines.push("");

    const ancestors = this.store.getAncestors(id);
    const descendants = this.store.getDescendants(id);

    if (ancestors.length > 0) {
      lines.push("Ancestors (supersedes / parents):");
      for (const a of ancestors) {
        const rel = entry.supersedes === a.id ? "supersedes" : "parent";
        lines.push(`  ${rel} → ${a.id}`);
        lines.push(`      cid="${a.cid}" message="${a.message.substring(0, 60)}" author="${a.author}"`);
      }
      lines.push("");
    }

    if (descendants.length > 0) {
      lines.push("Descendants (entries that supersede this):");
      for (const d of descendants) {
        lines.push(`  ← ${d.id} supersedes this`);
        lines.push(`      cid="${d.cid}" message="${d.message.substring(0, 60)}" author="${d.author}"`);
      }
      lines.push("");
    }

    const fullChain = this.store.getFullSupersessionChain(entry.cid, entry.scope);
    if (fullChain.length > 1) {
      lines.push(`Full supersession chain for cid="${entry.cid}" in scope="${entry.scope}":`);
      for (const ce of fullChain) {
        const marker = ce.id === id ? " <-- TARGET" : "";
        lines.push(`  ${ce.id} (${ce.status}) "${ce.message.substring(0, 50)}" ${ce.author}${marker}`);
      }
      lines.push("");
    }

    const compileInfo = this.buildProvenance(entry);
    if (compileInfo) {
      lines.push("Compiler provenance:");
      lines.push(`  sourceScope: ${compileInfo.sourceScope}`);
      lines.push(`  inherited: ${compileInfo.inherited}`);
      lines.push(`  fromParent: ${compileInfo.fromParent ?? "none"}`);
      lines.push(`  syncOrigin: ${compileInfo.syncOrigin ?? "unknown"}`);
      if (compileInfo.supersedesChain.length > 0) {
        lines.push(`  supersedesChain: ${compileInfo.supersedesChain.join(" → ")}`);
      }
      lines.push("");
    }

    const relatedAudit = this.auditLog.query({
      scopes: [entry.scope],
      types: ["entry.insert", "entry.supersede", "conflict.detected", "conflict.auto_resolved", "conflict.manual_resolved"],
      limit: 20,
    });

    const entryRelated = relatedAudit.filter((e) => {
      const eid = e.details?.entryId as string | undefined;
      const existingId = e.details?.existingEntryId as string | undefined;
      const incomingId = e.details?.incomingEntryId as string | undefined;
      const supersededId = e.details?.supersededId as string | undefined;
      return eid === id || supersededId === id || e.details?.supersedingId === id ||
        existingId === id || incomingId === id;
    });

    if (entryRelated.length > 0) {
      lines.push("Related audit events:");
      for (const ae of entryRelated) {
        lines.push(`  [${ae.type}] ${ae.timestamp} — ${ae.actor}`);
        if (Object.keys(ae.details).length > 0) {
          lines.push(`      details: ${JSON.stringify(ae.details)}`);
        }
      }
    }

    return lines.join("\n");
  }

  whyNotInherited(cid: string, childScope: string): string {
    const compiled = this.compiler.compile({ scope: childScope, budget: Infinity });
    const present = compiled.entries.find((ce) => ce.entry.cid === cid);

    if (present) {
      if (present.provenance.inherited) {
        return `Entry "${cid}" IS inherited into "${childScope}" from "${present.provenance.fromParent ?? "parent"}".\nPresent in compiled context.`;
      }
      return `Entry "${cid}" exists directly in "${childScope}" — it overrides any inherited value.`;
    }

    const childEntries = this.store.getByScopeAndCid(childScope, cid);
    if (childEntries.length > 0) {
      return `Entry "${cid}" exists in "${childScope}" but was dropped during compilation (budget/filter).`;
    }

    const parts = childScope.split(".");
    for (let i = parts.length - 1; i >= 1; i--) {
      const parentScope = parts.slice(0, i).join(".");
      const parentEntries = this.store.getAllActiveForScope(parentScope);
      const match = parentEntries.find((e) => e.cid === cid);
      if (match) {
        const reason = compiled.dropped.find((d) => d.cid === cid);
        if (reason) {
          return `Entry "${cid}" exists in parent scope "${parentScope}" but was dropped from compiled context.\nReason: ${reason.reason}. Message: "${reason.message}"`;
        }
        return `Entry "${cid}" exists in parent scope "${parentScope}" but not in "${childScope}".\nIt was either filtered, exceeded budget, or the child has no matching cid.`;
      }
    }

    return `Entry "${cid}" not found anywhere in the ancestry chain of "${childScope}".`;
  }

  private buildProvenance(entry: ContextEntry): EnhancedProvenance | null {
    try {
      const compiled = this.compiler.compile({ scope: entry.scope, cid: entry.cid });
      for (const ce of compiled.entries) {
        if (ce.entry.id === entry.id) {
          const base = ce.provenance;
          const events = this.auditLog.query({
            scopes: [entry.scope],
            types: ["entry.insert", "entry.supersede", "conflict.auto_resolved", "conflict.manual_resolved"],
            limit: 50,
          });
          const entryRelated = events.filter((e) => {
            const eid = e.details?.entryId as string | undefined;
            return eid === entry.id || eid === entry.supersedes;
          });
          return {
            sourceScope: base.sourceScope,
            inherited: base.inherited,
            fromParent: base.fromParent,
            supersedesChain: base.supersedesChain,
            syncOrigin: base.inherited ? "inherited" : "local",
            auditEventIds: entryRelated.map((e) => e.id),
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}