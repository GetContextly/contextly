export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private windows = new Map<string, number[]>();
  private configs: Map<string, RateLimitConfig>;

  constructor(configs?: Record<string, RateLimitConfig>) {
    this.configs = new Map(Object.entries(configs ?? {}));
    // Defaults
    if (!this.configs.has("read")) {
      this.configs.set("read", { windowMs: 60_000, maxRequests: 100 });
    }
    if (!this.configs.has("write")) {
      this.configs.set("write", { windowMs: 60_000, maxRequests: 30 });
    }
    if (!this.configs.has("resolve")) {
      this.configs.set("resolve", { windowMs: 60_000, maxRequests: 20 });
    }
    if (!this.configs.has("fork")) {
      this.configs.set("fork", { windowMs: 60_000, maxRequests: 10 });
    }
    if (!this.configs.has("merge")) {
      this.configs.set("merge", { windowMs: 60_000, maxRequests: 10 });
    }
  }

  check(key: string, operation: string): void {
    const config = this.configs.get(operation);
    if (!config) return;

    const now = Date.now();
    const windowKey = `${key}:${operation}`;
    let timestamps = this.windows.get(windowKey);

    if (!timestamps) {
      timestamps = [];
      this.windows.set(windowKey, timestamps);
    }

    // Prune expired entries
    const cutoff = now - config.windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= config.maxRequests) {
      const retryAfter = Math.ceil((timestamps[0] - cutoff) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded for "${operation}". Try again in ${retryAfter}s.`,
        retryAfter,
        operation,
      );
    }

    timestamps.push(now);
  }

  reset(): void {
    this.windows.clear();
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public operation: string,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}