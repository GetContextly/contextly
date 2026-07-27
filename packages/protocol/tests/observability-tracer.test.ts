import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { Compiler } from "../src/compiler.js";
import { AuditLog } from "../src/observability/audit-log.js";
import { DecisionTracer } from "../src/observability/decision-tracer.js";

describe("DecisionTracer", () => {
  it("traces a single entry and returns its full ancestry", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);

    const r1 = store.insert({
      cid: "auth.provider",
      message: "Use Supabase",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    const trace = tracer.traceEntry(r1.entry.id);

    expect(trace.rootEntry.id).toBe(r1.entry.id);
    expect(trace.rootEntry.cid).toBe("auth.provider");
    expect(trace.compiledIn).toContain(r1.entry.id);
    expect(trace.auditEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("traces supersession chain with multiple versions", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);

    const v1 = store.insert({
      cid: "db.orm",
      message: "Use Prisma",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    const v2 = store.insert({
      cid: "db.orm",
      message: "Use Drizzle",
      kind: "decision",
      scope: "project.test",
      author: "human:bob",
      supersedes: v1.entry.id,
    });

    const trace = tracer.traceEntry(v2.entry.id);

    expect(trace.rootEntry.message).toBe("Use Drizzle");
    expect(trace.fullAncestry.length).toBeGreaterThanOrEqual(1);
  });

  it("traces compiled context and returns multiple traces", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);

    store.insert({
      cid: "auth.provider",
      message: "Use Supabase",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    store.insert({
      cid: "db.orm",
      message: "Use Prisma",
      kind: "decision",
      scope: "project.test",
      author: "human:bob",
    });

    const compiled = compiler.compile({ scope: "project.test" });
    const traces = tracer.traceCompiledContext(compiled);

    expect(traces.length).toBe(2);
    expect(traces[0].rootEntry.id).toBeTruthy();
    expect(traces[1].rootEntry.id).toBeTruthy();
  });

  it("explain returns full entry details including supersession chain", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);

    const v1 = store.insert({
      cid: "api.design",
      message: "Use REST",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    const v2 = store.insert({
      cid: "api.design",
      message: "Use GraphQL",
      kind: "decision",
      scope: "project.test",
      author: "human:bob",
      supersedes: v1.entry.id,
    });

    const exp = tracer.explain(v2.entry.id);

    expect(exp.entry.id).toBe(v2.entry.id);
    expect(exp.supersessionChain.length).toBeGreaterThanOrEqual(2);
    expect(exp.parentDag).toBeDefined();
    expect(exp.descendants).toBeDefined();
  });

  it("whyDropped explains budget-based dropping", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const tracer = new DecisionTracer(store, compiler, audit);

    store.insert({
      cid: "important.rule",
      message: "This is a very long observation that should be compressed but not dropped",
      kind: "observation",
      scope: "project.test",
      author: "agent:test",
    });

    const result = tracer.whyDropped("important.rule", "project.test");

    expect(result.entry).toBeTruthy();
    expect(result.compiledContext).toBeTruthy();
  });
});