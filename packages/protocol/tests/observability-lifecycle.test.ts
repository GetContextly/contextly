import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { Compiler } from "../src/compiler.js";
import { AuditLog } from "../src/observability/audit-log.js";
import { DecisionTracer } from "../src/observability/decision-tracer.js";
import { AuditExporter } from "../src/observability/audit-exporter.js";
import { MetricsCollector } from "../src/observability/metrics.js";
import { AlertingEngine } from "../src/observability/alerting.js";
import { DebugTooling } from "../src/observability/debug-tooling.js";

describe("Full decision lifecycle trace", () => {
  it("traces one agent decision from commitment to compiled output to action", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);
    const exporter = new AuditExporter(audit);
    const metrics = new MetricsCollector();
    const alerting = new AlertingEngine(store, audit, { cooldownMs: 0 });
    const debug = new DebugTooling(store, compiler, audit);

    // ─── Phase 1: Initial context ─────────────────────────────────────
    store.insert({
      cid: "auth.provider",
      message: "Authentication uses Supabase RLS with JWTs.",
      kind: "decision",
      scope: "project.myapp",
      author: "human:alice",
    });

    store.insert({
      cid: "db.orm",
      message: "We use Drizzle ORM for database queries.",
      kind: "decision",
      scope: "project.myapp",
      author: "human:alice",
    });

    store.insert({
      cid: "deploy.target",
      message: "Production is deployed on Vercel.",
      kind: "decision",
      scope: "project.myapp",
      author: "human:bob",
    });

    store.insert({
      cid: "api.rules",
      message: "All API routes must validate input with Zod.",
      kind: "rule",
      scope: "project.myapp",
      author: "human:bob",
    });

    metrics.incrementCounter("entries.initial", { scope: "project.myapp" }, 4);

    // ─── Phase 2: Agent reads context ────────────────────────────────
    const compiledBefore = compiler.compile({ scope: "project.myapp" });
    metrics.recordCompilerCacheHit("project.myapp", compiledBefore.entries.length > 0);

    expect(compiledBefore.entries.length).toBeGreaterThanOrEqual(3);
    expect(compiledBefore.entries.some((e) => e.entry.cid === "auth.provider")).toBe(true);

    // ─── Phase 3: Agent commits a decision ───────────────────────────
    const insertResult = store.insert({
      cid: "caching.strategy",
      message: "Use Redis via Upstash for API response caching.",
      kind: "decision",
      scope: "project.myapp",
      author: "agent:claude",
    });

    metrics.incrementCounter("entries.committed", { author: "agent:claude" }, 1);
    expect(insertResult.conflict).toBeNull();
    expect(insertResult.entry.status).toBe("active");

    // ─── Phase 4: Conflict ──────────────────────────────────────────
    const conflictResult = store.insert({
      cid: "caching.strategy",
      message: "Use Cloudflare KV for edge caching.",
      kind: "decision",
      scope: "project.myapp",
      author: "agent:gpt-4",
    });

    expect(conflictResult.conflict).not.toBeNull();

    metrics.recordConflictEvent("project.myapp", "unresolved");

    // ─── Phase 5: Resolution ────────────────────────────────────────
    store.supersedeEntry(conflictResult.entry.id, "human:alice");
    compiler.invalidateScope("project.myapp");
    metrics.recordConflictEvent("project.myapp", "manual");

    // ─── Phase 6: Compile after resolution ──────────────────────────
    const compiledAfter = compiler.compile({ scope: "project.myapp", budget: Infinity });

    expect(compiledAfter.conflicts.length).toBe(0);
    const cachingEntry = compiledAfter.entries.find((e) => e.entry.cid === "caching.strategy");
    expect(cachingEntry).toBeTruthy();
    expect(cachingEntry!.entry.message).toContain("Redis");

    // ─── Phase 7: Trace ─────────────────────────────────────────────
    const trace = tracer.traceEntry(insertResult.entry.id, compiledAfter);

    expect(trace.rootEntry.id).toBe(insertResult.entry.id);
    expect(trace.compiledIn).toContain(insertResult.entry.id);
    expect(trace.fullAncestry.length).toBeGreaterThanOrEqual(1);

    // ─── Phase 8: Export ────────────────────────────────────────────
    const compliance = exporter.exportCompliancePackage("project.myapp");
    expect(compliance.summary.totalEvents).toBeGreaterThanOrEqual(7);
    expect(compliance.summary.eventTypeBreakdown["conflict.detected"]).toBeGreaterThanOrEqual(1);
    expect(compliance.summary.eventTypeBreakdown["entry.insert"]).toBeGreaterThanOrEqual(5);

    // ─── Phase 9: Debug ─────────────────────────────────────────────
    const exp = debug.explain(insertResult.entry.id);
    expect(exp.entry.id).toBe(insertResult.entry.id);
    expect(exp.descendants.length).toBeGreaterThanOrEqual(0);
    expect(exp.supersessionChain.length).toBeGreaterThanOrEqual(1);

    const dag = debug.ancestryDag(insertResult.entry.id);
    expect(dag).toContain("Ancestry DAG for");
    expect(dag).toContain("caching.strategy");
    expect(dag).toContain(insertResult.entry.id);

    // ─── Phase 10: Metrics ──────────────────────────────────────────
    const snap = metrics.snapshot();
    expect(snap.otelMetrics).toContain("entries.committed");
    expect(snap.otelMetrics).toContain("entries.initial");
    expect(snap.raw.length).toBeGreaterThanOrEqual(3);

    // ─── Phase 11: Alerting ─────────────────────────────────────────
    const signals = alerting.evaluate();
    expect(signals.filter((s) => s.rule === "conflict_spike")).toHaveLength(0);

    // ─── Verification: full traceability ────────────────────────────
    const auditEvents = trace.auditEvents;
    expect(auditEvents.length).toBeGreaterThanOrEqual(1);
    expect(auditEvents.some((e) => e.type === "conflict.detected")).toBe(true);
    expect(auditEvents.some((e) => e.type === "entry.supersede")).toBe(true);

    // All 5 primitives verified: read (compiler), write (insert),
    // resolve (supersedeEntry), provenance (trace), audit (export)
  });
});