import { AuditLog } from "./audit-log.js";
import { Store } from "../store.js";
import type { AlertContext, AlertRule, AlertSignal } from "./types.js";

export type AlertHandler = (signal: AlertSignal) => void;

export class AlertingEngine {
  private rules: AlertRule[] = [];
  private handlers: AlertHandler[] = [];
  private firedSignals: Map<string, number> = new Map();
  private cooldownMs: number;

  constructor(
    private store: Store,
    private auditLog: AuditLog,
    opts?: { cooldownMs?: number },
  ) {
    this.cooldownMs = opts?.cooldownMs ?? 300000;
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.addRule({
      name: "cross_tenant_access",
      description: "Detect access attempts across tenant boundaries",
      severity: "critical",
      check: (ctx: AlertContext) => {
        const events = ctx.getRecentEvents("*", 60000);
        const scopes = new Set<string>();
        for (const e of events) {
          scopes.add(e.scope);
        }
        const scopeList = [...scopes].filter((s) => s !== "*");
        if (scopeList.length > 1) {
          const crossScope = events.filter((e) => e.type.startsWith("access."));
          const uniquePairs = new Set<string>();
          for (const e of crossScope) {
            const actor = (e.details?.actor as string) ?? e.actor;
            uniquePairs.add(`${actor}@${e.scope}`);
          }
          if (uniquePairs.size > scopeList.length) {
            return {
              rule: "cross_tenant_access",
              severity: "critical",
              message: `Same actor(s) accessed ${uniquePairs.size} scope(s) in 60s window: ${[...uniquePairs].join(", ")}`,
              scope: scopeList.join(","),
              timestamp: new Date().toISOString(),
              context: { events: events.length, uniquePairs: [...uniquePairs] },
            };
          }
        }
        return null;
      },
    });

    this.addRule({
      name: "conflict_spike",
      description: "Detect sharp increase in conflicts within a single scope",
      severity: "warn",
      check: (ctx: AlertContext) => {
        const scopes = this.auditLog.getScopes();
        for (const scope of scopes) {
          const recentConflicts = ctx.getRecentEvents(scope, 300000);
          const conflictEvents = recentConflicts.filter(
            (e) => e.type === "conflict.detected" || e.type === "conflict.auto_resolved",
          );
          if (conflictEvents.length >= 5) {
            return {
              rule: "conflict_spike",
              severity: conflictEvents.length >= 10 ? "critical" : "warn",
              message: `Scope "${scope}" has ${conflictEvents.length} conflict events in last 5 minutes`,
              scope,
              timestamp: new Date().toISOString(),
              context: { conflictCount: conflictEvents.length, windowMs: 300000 },
            };
          }
        }
        return null;
      },
    });

    this.addRule({
      name: "sync_divergence",
      description: "Detect sync divergence exceeding threshold",
      severity: "warn",
      check: (ctx: AlertContext) => {
        const scopes = this.auditLog.getScopes();
        for (const scope of scopes) {
          const state = ctx.getSyncState(scope);
          if (state.status === "conflict") {
            const recentSyncs = ctx.getRecentEvents(scope, 600000);
            const failedSyncs = recentSyncs.filter(
              (e) => e.type === "sync.push" || e.type === "sync.pull",
            );
            if (failedSyncs.length >= 3) {
              return {
                rule: "sync_divergence",
                severity: "critical",
                message: `Scope "${scope}" has sync state "conflict" with ${failedSyncs.length} recent sync events`,
                scope,
                timestamp: new Date().toISOString(),
                context: { syncStatus: state.status, recentSyncs: failedSyncs.length },
              };
            }
          }
        }
        return null;
      },
    });

    this.addRule({
      name: "auto_resolution_feedback",
      description: "Detect high disagreement rate with auto-resolutions",
      severity: "warn",
      check: (ctx: AlertContext) => {
        const events = ctx.getRecentEvents("*", 86400000);
        const feedbackEvents = events.filter((e) => (e.details?.disagreed as boolean) === true);
        if (feedbackEvents.length >= 3) {
          const scopes = [...new Set(feedbackEvents.map((e) => e.scope))];
          return {
            rule: "auto_resolution_feedback",
            severity: feedbackEvents.length >= 10 ? "critical" : "warn",
            message: `${feedbackEvents.length} disagreement(s) on auto-resolutions across ${scopes.length} scope(s) in last 24h`,
            scope: scopes.join(","),
            timestamp: new Date().toISOString(),
            context: { disagreements: feedbackEvents.length, scopes },
          };
        }
        return null;
      },
    });
  }

  addRule(rule: AlertRule): () => void {
    this.rules.push(rule);
    return () => {
      this.rules = this.rules.filter((r) => r.name !== rule.name);
    };
  }

  onAlert(handler: AlertHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  evaluate(): AlertSignal[] {
    const ctx: AlertContext = {
      getConflicts: (scope: string) => this.store.getConflicts(scope),
      getRecentEvents: (scope: string, sinceMs: number) => this.auditLog.getRecentEvents(scope, sinceMs),
      getSyncState: (scope: string) => {
        try {
          const events = this.auditLog.getRecentEvents(scope, 86400000);
          const lastSync = events.filter((e) => e.type === "sync.push" || e.type === "sync.pull");
          const status = events.some((e) => e.type === "conflict.detected") ? "conflict" : "synced";
          return {
            lastSyncTimestamp: lastSync.length > 0 ? lastSync[lastSync.length - 1].timestamp : null,
            status,
          };
        } catch {
          return { lastSyncTimestamp: null, status: "synced" };
        }
      },
    };

    const signals: AlertSignal[] = [];
    const now = Date.now();

    for (const rule of this.rules) {
      try {
        const signal = rule.check(ctx);
        if (signal) {
          const firedKey = `${rule.name}:${signal.scope}`;
          const lastFired = this.firedSignals.get(firedKey) ?? 0;
          if (now - lastFired >= this.cooldownMs) {
            this.firedSignals.set(firedKey, now);
            signals.push(signal);
            for (const handler of this.handlers) {
              try { handler(signal); } catch { /* handler errors are silent */ }
            }
          }
        }
      } catch {
        // rule evaluation errors are silent
      }
    }

    return signals;
  }
}