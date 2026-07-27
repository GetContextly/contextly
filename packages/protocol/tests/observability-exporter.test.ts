import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { AuditLog } from "../src/observability/audit-log.js";
import { AuditExporter } from "../src/observability/audit-exporter.js";

describe("AuditExporter", () => {
  it("exports tenant-scoped events as JSONL", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const exporter = new AuditExporter(audit);

    audit.record("entry.insert", "tenant.a", "agent:1", { entryId: "id1" });
    audit.record("entry.insert", "tenant.b", "agent:2", { entryId: "id2" });
    audit.record("entry.supersede", "tenant.a", "agent:1", { entryId: "id3" });

    const output = exporter.exportTenant({
      scopes: ["tenant.a"],
      format: "jsonl",
    });

    const lines = output.trim().split("\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const parsed = JSON.parse(line);
      expect(parsed.scope).toBe("tenant.a");
    }
  });

  it("exports all scopes when no filter given", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const exporter = new AuditExporter(audit);

    audit.record("entry.insert", "scope.a", "agent:1");
    audit.record("entry.insert", "scope.b", "agent:2");

    const output = exporter.exportAllScopes();
    const lines = output.trim().split("\n").filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it("exports compliance package with summary", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const exporter = new AuditExporter(audit);

    audit.record("entry.insert", "compliance.scope", "agent:1", { entryId: "id1" });
    audit.record("entry.supersede", "compliance.scope", "human:alice", { entryId: "id2" });
    audit.record("conflict.detected", "compliance.scope", "agent:1", { cid: "key" });

    const pkg = exporter.exportCompliancePackage("compliance.scope");
    expect(pkg.summary.totalEvents).toBe(3);
    expect(pkg.summary.scope).toBe("compliance.scope");
    expect(pkg.summary.eventTypeBreakdown["entry.insert"]).toBe(1);
    expect(pkg.summary.eventTypeBreakdown["entry.supersede"]).toBe(1);
    expect(pkg.summary.eventTypeBreakdown["conflict.detected"]).toBe(1);
    expect(pkg.summary.exportGeneratedAt).toBeTruthy();

    const auditLines = pkg.auditLog.trim().split("\n").filter(Boolean);
    expect(auditLines).toHaveLength(3);
  });
});