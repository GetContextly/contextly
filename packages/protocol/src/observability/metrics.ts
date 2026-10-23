import { type AuditEvent, type MetricPoint, type MetricsSnapshot } from "./types.js";

interface LatencyBucket {
  count: number;
  totalMs: number;
  max: number;
  p50: number;
  p99: number;
  raw: number[];
}

export class MetricsCollector {
  private points: MetricPoint[] = [];
  private latencies: Map<string, LatencyBucket> = new Map();
  private counters: Map<string, Map<string, number>> = new Map();
  private timeWindowMs: number;
  private maxPoints: number;

  constructor(opts?: { timeWindowMs?: number; maxPoints?: number }) {
    this.timeWindowMs = opts?.timeWindowMs ?? 3600000;
    this.maxPoints = opts?.maxPoints ?? 10000;
  }

  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void {
    const key = `${name}|${this.labelKey(labels ?? {})}`;
    if (!this.counters.has(name)) this.counters.set(name, new Map());
    const sub = this.counters.get(name)!;
    sub.set(key, (sub.get(key) ?? 0) + (value ?? 1));

    this.recordPoint({
      name,
      value: sub.get(key)!,
      labels: labels ?? {},
      timestamp: new Date().toISOString(),
    });
  }

  recordLatency(operation: string, durationMs: number, labels?: Record<string, string>): void {
    const key = `${operation}|${this.labelKey(labels ?? {})}`;
    if (!this.latencies.has(key)) {
      this.latencies.set(key, { count: 0, totalMs: 0, max: 0, p50: 0, p99: 0, raw: [] });
    }
    const bucket = this.latencies.get(key)!;
    bucket.count++;
    bucket.totalMs += durationMs;
    bucket.max = Math.max(bucket.max, durationMs);
    bucket.raw.push(durationMs);

    this.recordPoint({
      name: `latency.${operation}`,
      value: durationMs,
      labels: { ...(labels ?? {}), operation },
      timestamp: new Date().toISOString(),
    });
  }

  recordAuditEvent(event: AuditEvent): void {
    this.incrementCounter("audit.events", { type: event.type, scope: event.scope });
  }

  recordCompilerCacheHit(scope: string, hit: boolean): void {
    this.incrementCounter("compiler.cache", { scope, result: hit ? "hit" : "miss" });
  }

  recordConflictEvent(scope: string, resolution: "auto" | "manual" | "unresolved"): void {
    this.incrementCounter("conflict.resolution", { scope, resolution });
  }

  recordSyncEvent(scope: string, direction: "push" | "pull", success: boolean): void {
    this.incrementCounter("sync.operation", { scope, direction, success: success ? "true" : "false" });
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const sub = this.counters.get(name);
    if (!sub) return 0;
    const key = `${name}|${this.labelKey(labels ?? {})}`;
    return sub.get(key) ?? 0;
  }

  getLatencyStats(operation: string): {
    count: number;
    avgMs: number;
    maxMs: number;
    p50Ms: number;
    p99Ms: number;
  } | null {
    for (const [, bucket] of this.latencies) {
      if (bucket.raw.length === 0) continue;
      const sorted = [...bucket.raw].sort((a, b) => a - b);
      bucket.p50 = sorted[Math.floor(sorted.length * 0.5)];
      bucket.p99 = sorted[Math.floor(sorted.length * 0.99)];
    }

    const key = `${operation}|`;
    for (const [k, bucket] of this.latencies) {
      if (k.startsWith(key)) {
        return {
          count: bucket.count,
          avgMs: bucket.count > 0 ? Math.round(bucket.totalMs / bucket.count) : 0,
          maxMs: bucket.max,
          p50Ms: bucket.p50,
          p99Ms: bucket.p99,
        };
      }
    }
    return null;
  }

  snapshot(): MetricsSnapshot {
    for (const [, bucket] of this.latencies) {
      if (bucket.raw.length > 0) {
        const sorted = [...bucket.raw].sort((a, b) => a - b);
        bucket.p50 = sorted[Math.floor(sorted.length * 0.5)];
        bucket.p99 = sorted[Math.floor(sorted.length * 0.99)];
      }
    }

    const raw = this.getRecentPoints();
    const otelMetrics = this.toOpenTelemetry(raw);

    return { otelMetrics, raw, timeWindowMs: this.timeWindowMs };
  }

  private toOpenTelemetry(points: MetricPoint[]): string {
    const lines: string[] = [];

    for (const point of points) {
      const labels = Object.entries(point.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      const labelStr = labels ? `{${labels}}` : "";
      lines.push(`# TYPE ${point.name} gauge`);
      lines.push(`${point.name}${labelStr} ${point.value} ${new Date(point.timestamp).getTime()}`);
    }

    return lines.join("\n");
  }

  reset(): void {
    this.points = [];
    this.latencies.clear();
    this.counters.clear();
  }

  private recordPoint(p: MetricPoint): void {
    this.points.push(p);
    if (this.points.length > this.maxPoints) {
      this.points.splice(0, this.points.length - this.maxPoints);
    }

    const cutoff = Date.now() - this.timeWindowMs;
    this.points = this.points.filter((pt) => new Date(pt.timestamp).getTime() > cutoff);
  }

  private getRecentPoints(): MetricPoint[] {
    const cutoff = Date.now() - this.timeWindowMs;
    return this.points.filter((p) => new Date(p.timestamp).getTime() > cutoff);
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  }
}