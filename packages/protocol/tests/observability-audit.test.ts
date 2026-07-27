import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { AuditLog } from "../src/observability/audit-log.js";

describe("AuditLog", () => {
  it("records an event and returns it with id and timestamp", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    const event = audit.record("entry.insert", "test.scope", "agent:test", {
      entryId: "sha256:abc",
      cid: "test.cid",
    });

    expect(event.type).toBe("entry.insert");
    expect(event.scope).toBe("test.scope");
    expect(event.actor).toBe("agent:test");
    expect(event.id).toMatch(/^audit:/);
    expect(event.timestamp).toBeTruthy();
    expect(event.details.entryId).toBe("sha256:abc");
  });

  it("queries events by scope", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.record("entry.insert", "scope.b", "agent:2");
    audit.record("entry.supersede", "scope.a", "agent:1");

    const scopeA = audit.getByScope("scope.a");
    expect(scopeA).toHaveLength(2);
    expect(scopeA.every((e) => e.scope === "scope.a")).toBe(true);
  });

  it("queries events by type", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.record("entry.insert", "scope.b", "agent:2");
    audit.record("entry.supersede", "scope.a", "agent:1");

    const inserts = audit.getByType("entry.insert");
    expect(inserts).toHaveLength(2);
    expect(inserts.every((e) => e.type === "entry.insert")).toBe(true);
  });

  it("returns distinct scopes", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.record("entry.insert", "scope.b", "agent:2");

    const scopes = audit.getScopes();
    expect(scopes).toContain("scope.a");
    expect(scopes).toContain("scope.b");
  });

  it("supports time-window filtering via getRecentEvents", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");

    const recent = audit.getRecentEvents("scope.a", 60000);
    expect(recent.length).toBeGreaterThanOrEqual(1);
  });

  it("supports query with since/until", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.record("entry.insert", "scope.a", "agent:2");

    const since = new Date(Date.now() - 1000).toISOString();
    const results = audit.query({ scopes: ["scope.a"], since });
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("clear removes all events and resets seq", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.clear();

    expect(audit.getByScope("scope.a")).toHaveLength(0);
  });
});

describe("Store audit instrumentation", () => {
  it("records audit event on entry insert", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    store.insert({
      cid: "test.key",
      message: "test message",
      kind: "decision",
      scope: "test.scope",
      author: "agent:test",
    });

    const events = audit.getByType("entry.insert");
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].scope).toBe("test.scope");
    expect(events[0].actor).toBe("agent:test");
  });

  it("records audit event on supersedeEntry", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());

    const r1 = store.insert({
      cid: "test.key",
      message: "version 1",
      kind: "decision",
      scope: "test.scope",
      author: "agent:a",
    });

    store.supersedeEntry(r1.entry.id, "agent:resolver");

    const events = audit.getByType("entry.supersede");
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});