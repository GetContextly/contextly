import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { Compiler } from "../src/compiler.js";
import { AuditLog } from "../src/observability/audit-log.js";
import { DebugTooling } from "../src/observability/debug-tooling.js";

describe("DebugTooling", () => {
  it("explain returns full details for an entry", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const debug = new DebugTooling(store, compiler, audit);

    const r1 = store.insert({
      cid: "auth.provider",
      message: "Use Supabase",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    const exp = debug.explain(r1.entry.id);
    expect(exp.entry.id).toBe(r1.entry.id);
    expect(exp.supersessionChain).toContainEqual(expect.objectContaining({ id: r1.entry.id }));
    expect(exp.parentDag).toEqual([]);
  });

  it("whyDropped explains why an entry is missing from compiled output", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const debug = new DebugTooling(store, compiler, audit);

    store.insert({
      cid: "verbose.obs",
      message: "This is a very long observation that goes on and on and on and should be compressed or dropped",
      kind: "observation",
      scope: "project.test",
      author: "agent:test",
    });

    const result = debug.whyDropped("verbose.obs", "project.test");
    expect(result.entry).toBeTruthy();
    expect(result.compiledContext).toBeTruthy();
  });

  it("traceScope returns all active entries with provenance", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const debug = new DebugTooling(store, compiler, audit);

    store.insert({
      cid: "key1",
      message: "Entry one",
      kind: "decision",
      scope: "project.test",
      author: "human:alice",
    });

    store.insert({
      cid: "key2",
      message: "Entry two",
      kind: "rule",
      scope: "project.test",
      author: "human:bob",
    });

    const result = debug.traceScope("project.test");
    expect(result.traces.length).toBe(2);
    expect(result.compiledContext.entries.length).toBe(2);
  });

  it("ancestryDag produces human-readable output", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const debug = new DebugTooling(store, compiler, audit);

    const r1 = store.insert({
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
      supersedes: r1.entry.id,
    });

    const dag = debug.ancestryDag(v2.entry.id);
    expect(dag).toContain("Ancestry DAG for");
    expect(dag).toContain("api.design");
    expect(dag).toContain("Use GraphQL");
    expect(dag).toContain(r1.entry.id);
  });

  it("whyNotInherited explains inheritance status", () => {
    const store = new Store(":memory:");
    const compiler = new Compiler(store);
    const audit = new AuditLog(store.getDb());
    const debug = new DebugTooling(store, compiler, audit);

    store.insert({
      cid: "shared.rule",
      message: "No direct DB access",
      kind: "rule",
      scope: "parent.scope",
      author: "human:alice",
    });

    const result = debug.whyNotInherited("shared.rule", "parent.scope.child");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});