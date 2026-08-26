import { AuditLog } from "./audit-log.js";
import type { AuditEvent, TenantExportOptions } from "./types.js";

export class AuditExporter {
  constructor(private auditLog: AuditLog) {}

  exportTenant(options: TenantExportOptions): string {
    const events = this.auditLog.query({
      scopes: options.scopes,
      types: options.eventTypes,
      since: options.since,
      until: options.until,
      limit: 100000,
    });

    return this.serialize(events, options.format ?? "jsonl");
  }

  exportAllScopes(since?: string, until?: string): string {
    const scopes = this.auditLog.getScopes();
    return this.exportTenant({ scopes, since, until, format: "jsonl" });
  }

  exportCompliancePackage(scope: string): {
    auditLog: string;
    summary: {
      totalEvents: number;
      scope: string;
      exportGeneratedAt: string;
      eventTypeBreakdown: Record<string, number>;
      dateRange: { earliest: string | null; latest: string | null };
    };
  } {
    const events = this.auditLog.getByScope(scope, 100000);

    const typeBreakdown: Record<string, number> = {};
    for (const e of events) {
      typeBreakdown[e.type] = (typeBreakdown[e.type] ?? 0) + 1;
    }

    const timestamps = events.map((e) => e.timestamp).filter(Boolean).sort();
    const earliest = timestamps.length > 0 ? timestamps[0] : null;
    const latest = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;

    return {
      auditLog: this.serialize(events, "jsonl"),
      summary: {
        totalEvents: events.length,
        scope,
        exportGeneratedAt: new Date().toISOString(),
        eventTypeBreakdown: typeBreakdown,
        dateRange: { earliest, latest },
      },
    };
  }

  private serialize(events: AuditEvent[], format: "jsonl" | "json"): string {
    if (format === "jsonl") {
      return events.map((e) => JSON.stringify(e)).join("\n");
    }
    return JSON.stringify(events, null, 2);
  }
}