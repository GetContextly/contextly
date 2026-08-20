import { describe, it, expect } from "vitest";
import { Store } from "../src/store.js";
import { AuditLog } from "../src/observability/audit-log.js";
import { MetricsCollector } from "../src/observability/metrics.js";
import { AlertingEngine, type AlertHandler } from "../src/observability/alerting.js";

describe("AlertingEngine", () => {
  it("registers and evaluates default rules", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const metrics = new MetricsCollector();
    const engine = new AlertingEngine(store, audit, { cooldownMs: 0 });

    const signals = engine.evaluate();
    expect(Array.isArray(signals)).toBe(true);
  });

  it("fires conflict_spike when many conflict events occur", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const engine = new AlertingEngine(store, audit, { cooldownMs: 0 });

    for (let i = 0; i < 5; i++) {
      audit.record("conflict.detected", "busy.scope", "agent:test", {
        cid: `key.${i}`,
      });
    }

    const signals = engine.evaluate();
    const conflictSpikes = signals.filter((s) => s.rule === "conflict_spike");
    expect(conflictSpikes.length).toBeGreaterThanOrEqual(1);
    expect(conflictSpikes[0].scope).toBe("busy.scope");
  });

  it("calls registered handlers on alert", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const engine = new AlertingEngine(store, audit, { cooldownMs: 0 });

    const received: string[] = [];
    const handler: AlertHandler = (signal) => {
      received.push(signal.rule);
    };
    engine.onAlert(handler);

    for (let i = 0; i < 5; i++) {
      audit.record("conflict.detected", "busy.scope", "agent:test", {
        cid: `key.${i}`,
      });
    }

    engine.evaluate();
    expect(received.length).toBeGreaterThanOrEqual(1);
  });

  it("custom rules can be added and removed", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const engine = new AlertingEngine(store, audit, { cooldownMs: 0 });

    const remove = engine.addRule({
      name: "custom_test",
      description: "Always fires",
      severity: "info",
      check: () => ({
        rule: "custom_test",
        severity: "info" as const,
        message: "Custom alert",
        scope: "test",
        timestamp: new Date().toISOString(),
        context: {},
      }),
    });

    const signals = engine.evaluate();
    expect(signals.some((s) => s.rule === "custom_test")).toBe(true);

    remove();

    const signals2 = engine.evaluate();
    expect(signals2.some((s) => s.rule === "custom_test")).toBe(false);
  });

  it("respects cooldown between repeated firings", () => {
    const store = new Store(":memory:");
    const audit = new AuditLog(store.getDb());
    const engine = new AlertingEngine(store, audit, { cooldownMs: 60000 });

    for (let i = 0; i < 5; i++) {
      audit.record("conflict.detected", "busy.scope", "agent:test", {
        cid: `key.${i}`,
      });
    }

    const first = engine.evaluate();
    const second = engine.evaluate(); // within cooldown

    // Second evaluation should not fire new signals due to cooldown
    expect(second.length).toBe(0);
  });
});