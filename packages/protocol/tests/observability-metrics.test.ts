import { describe, it, expect } from "vitest";
import { MetricsCollector } from "../src/observability/metrics.js";

describe("MetricsCollector", () => {
  it("increments counters and retrieves values", () => {
    const m = new MetricsCollector();

    m.incrementCounter("test.counter", { scope: "a" });
    m.incrementCounter("test.counter", { scope: "a" });
    m.incrementCounter("test.counter", { scope: "b" });

    expect(m.getCounter("test.counter", { scope: "a" })).toBe(2);
    expect(m.getCounter("test.counter", { scope: "b" })).toBe(1);
  });

  it("records latencies and computes p50/p99", () => {
    const m = new MetricsCollector();

    m.recordLatency("read", 10);
    m.recordLatency("read", 20);
    m.recordLatency("read", 30);
    m.recordLatency("read", 100);
    m.recordLatency("read", 500);

    const stats = m.getLatencyStats("read");
    expect(stats).toBeTruthy();
    expect(stats!.count).toBe(5);
    expect(stats!.avgMs).toBeGreaterThan(0);
    expect(stats!.maxMs).toBe(500);
  });

  it("records compiler cache hits", () => {
    const m = new MetricsCollector();

    m.recordCompilerCacheHit("scope.a", true);
    m.recordCompilerCacheHit("scope.a", false);

    expect(m.getCounter("compiler.cache", { scope: "scope.a", result: "hit" })).toBe(1);
    expect(m.getCounter("compiler.cache", { scope: "scope.a", result: "miss" })).toBe(1);
  });

  it("records conflict events", () => {
    const m = new MetricsCollector();

    m.recordConflictEvent("scope.a", "auto");
    m.recordConflictEvent("scope.a", "manual");
    m.recordConflictEvent("scope.b", "unresolved");

    expect(m.getCounter("conflict.resolution", { scope: "scope.a", resolution: "auto" })).toBe(1);
    expect(m.getCounter("conflict.resolution", { scope: "scope.b", resolution: "unresolved" })).toBe(1);
  });

  it("records sync events", () => {
    const m = new MetricsCollector();

    m.recordSyncEvent("scope.a", "push", true);
    m.recordSyncEvent("scope.a", "pull", false);

    expect(m.getCounter("sync.operation", { scope: "scope.a", direction: "push", success: "true" })).toBe(1);
    expect(m.getCounter("sync.operation", { scope: "scope.a", direction: "pull", success: "false" })).toBe(1);
  });

  it("generates OpenTelemetry-compatible snapshot", () => {
    const m = new MetricsCollector();

    m.incrementCounter("test.metric", { env: "test" });
    const snap = m.snapshot();

    expect(snap.otelMetrics).toContain("# TYPE test.metric gauge");
    expect(snap.otelMetrics).toContain(`test.metric{env="test"}`);
    expect(snap.raw.length).toBeGreaterThanOrEqual(1);
  });

  it("resets all state", () => {
    const m = new MetricsCollector();

    m.incrementCounter("test.counter");
    m.recordLatency("read", 10);
    m.reset();

    expect(m.getCounter("test.counter")).toBe(0);
    expect(m.getLatencyStats("read")).toBeNull();
  });
});