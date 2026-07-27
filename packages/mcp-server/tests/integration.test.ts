import { describe, it, expect, beforeEach } from "vitest";
import { createMcpServer } from "../src/index.js";
import { generateToken, parseToken, validateScope } from "../src/auth.js";
import { RateLimiter } from "../src/rate-limiter.js";

describe("MCP Server v2 — Two-Agent Integration", () => {
  const scope = "test.project";
  const tokenAlice = generateToken(scope, "agent:alice");
  const tokenBob = generateToken(scope, "agent:bob");

  let server: ReturnType<typeof createMcpServer>;

  beforeEach(() => {
    server = createMcpServer({ token: tokenAlice, validTokens: [tokenAlice, tokenBob] });
  });

  describe("Agent Alice: reads empty context, commits a decision", () => {
    it("reads empty context from fresh scope", () => {
      const compiler = server.compiler;
      const result = compiler.compile({ scope });

      expect(result.entries).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.stats.totalActive).toBe(0);
    });

    it("commits a decision", () => {
      const store = server.store;
      store.insert({
        scope,
        cid: "tech.stack",
        message: "Uses TypeScript and Node.js.",
        kind: "decision",
        author: tokenAlice,
      });

      const entry = store.getByScopeAndCid(scope, "tech.stack");
      expect(entry).toHaveLength(1);
      expect(entry[0].message).toBe("Uses TypeScript and Node.js.");
    });

    it("reads back the committed decision via compiler", () => {
      const store = server.store;
      const compiler = server.compiler;

      store.insert({
        scope,
        cid: "tech.stack",
        message: "Uses TypeScript and Node.js.",
        kind: "decision",
        author: tokenAlice,
      });

      const result = compiler.compile({ scope });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.message).toBe("Uses TypeScript and Node.js.");
      expect(result.entries[0].provenance.inherited).toBe(false);
    });

    it("commit is idempotent — same cid+message produces duplicate error", () => {
      const store = server.store;

      store.insert({
        scope,
        cid: "db.orm",
        message: "Uses Drizzle.",
        kind: "decision",
        author: tokenAlice,
      });

      const act = () =>
        store.insert({
          scope,
          cid: "db.orm",
          message: "Uses Drizzle.",
          kind: "decision",
          author: tokenAlice,
        });

      expect(act).toThrow(/already exists/);
    });
  });

  describe("Agent Bob: reads Alice's context, adds his own", () => {
    it("Bob sees Alice's decision in compiled context", () => {
      const store = server.store;
      const compiler = server.compiler;

      store.insert({
        scope,
        cid: "tech.stack",
        message: "Uses TypeScript and Node.js.",
        kind: "decision",
        author: tokenAlice,
      });

      const result = compiler.compile({ scope });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.message).toBe("Uses TypeScript and Node.js.");
    });

    it("Bob adds a rule — both entries visible", () => {
      const store = server.store;
      const compiler = server.compiler;

      store.insert({
        scope,
        cid: "tech.stack",
        message: "Uses TypeScript and Node.js.",
        kind: "decision",
        author: tokenAlice,
      });

      store.insert({
        scope,
        cid: "code.style",
        message: "Use Prettier with 2-space indent.",
        kind: "rule",
        author: tokenBob,
      });

      const result = compiler.compile({ scope });
      expect(result.entries).toHaveLength(2);

      expect(result.entries[0].entry.kind).toBe("rule");
      expect(result.entries[0].entry.cid).toBe("code.style");

      expect(result.entries[1].entry.kind).toBe("decision");
      expect(result.entries[1].entry.cid).toBe("tech.stack");
    });
  });

  describe("Conflict detection across agents", () => {
    it("Alice and Bob write different messages for same cid — conflict", () => {
      const store = server.store;
      const compiler = server.compiler;

      store.insert({
        scope,
        cid: "db.orm",
        message: "Use Prisma.",
        kind: "decision",
        author: tokenAlice,
      });

      store.insert({
        scope,
        cid: "db.orm",
        message: "Use Drizzle.",
        kind: "decision",
        author: tokenBob,
      });

      const result = compiler.compile({ scope });
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].cid).toBe("db.orm");

      const dbEntries = result.entries.filter((e) => e.entry.cid === "db.orm");
      expect(dbEntries.length).toBeGreaterThan(1);
    });

    it("Bob resolves conflict by superseding Alice's entry", () => {
      const store = server.store;
      const compiler = server.compiler;

      const aliceEntry = store.insert({
        scope,
        cid: "db.orm",
        message: "Use Prisma.",
        kind: "decision",
        author: tokenAlice,
      });

      store.insert({
        scope,
        cid: "db.orm",
        message: "Use Drizzle.",
        kind: "decision",
        author: tokenBob,
      });

      const conflict = compiler.compile({ scope }).conflicts;
      expect(conflict.length).toBeGreaterThan(0);

      compiler.invalidateScope(scope);
      store.insert({
        scope,
        cid: "db.orm",
        message: "Use Drizzle with pgvector.",
        kind: "decision",
        author: tokenBob,
        supersedes: aliceEntry.entry.id,
      });

      const result = compiler.compile({ scope });
      const activeDbEntry = result.entries.find((e) => e.entry.cid === "db.orm");
      expect(activeDbEntry).toBeDefined();
      expect(activeDbEntry!.entry.message).toBe("Use Drizzle with pgvector.");
    });
  });

  describe("Rate limiting", () => {
    it("enforces rate limits per operation", () => {
      const smallLimiter = new RateLimiter({
        read: { windowMs: 60_000, maxRequests: 2 },
      });

      smallLimiter.check("test", "read");
      smallLimiter.check("test", "read");
      expect(() => smallLimiter.check("test", "read")).toThrow();
    });

    it("rate limiting resets after window expires", async () => {
      const smallLimiter = new RateLimiter({
        read: { windowMs: 50, maxRequests: 1 },
      });

      smallLimiter.check("test", "read");
      expect(() => smallLimiter.check("test", "read")).toThrow();

      await new Promise((r) => setTimeout(r, 60));
      smallLimiter.check("test", "read");
    });
  });

  describe("Auth enforcement", () => {
    it("rejects access to wrong scope", () => {
      expect(() =>
        validateScope("project.a", "project.b", "read", ["read", "write"]),
      ).toThrow(/cannot access/);
    });

    it("allows child scope access from parent token", () => {
      expect(() =>
        validateScope("project", "project.auth", "read", ["read", "write"]),
      ).not.toThrow();
    });
  });

  describe("Full agent loop: read reason commit second agent reads", () => {
    it("simulates two agents sharing context", () => {
      const store = server.store;
      const compiler = server.compiler;

      const aliceStart = compiler.compile({ scope });
      expect(aliceStart.entries).toHaveLength(0);

      store.insert({
        scope,
        cid: "tech.stack",
        message: "Uses TypeScript, Node.js, and Supabase.",
        kind: "decision",
        author: tokenAlice,
      });
      store.insert({
        scope,
        cid: "code.review",
        message: "All PRs require at least one approval.",
        kind: "rule",
        author: tokenAlice,
      });
      store.insert({
        scope,
        cid: "api.latency",
        message: "API averages 240ms response time.",
        kind: "observation",
        author: tokenAlice,
      });

      compiler.invalidateScope(scope);
      const aliceEnd = compiler.compile({ scope });
      expect(aliceEnd.entries).toHaveLength(3);

      const bobRead = compiler.compile({ scope });
      expect(bobRead.entries).toHaveLength(3);
      expect(bobRead.entries[0].entry.kind).toBe("rule");
      expect(bobRead.entries[1].entry.kind).toBe("decision");
      expect(bobRead.entries[2].entry.kind).toBe("observation");

      store.insert({
        scope,
        cid: "deploy.host",
        message: "Deploy on Vercel.",
        kind: "decision",
        author: tokenBob,
      });

      compiler.invalidateScope(scope);
      const bobEnd = compiler.compile({ scope });
      expect(bobEnd.entries).toHaveLength(4);
      expect(bobEnd.entries.some((e) => e.entry.cid === "deploy.host")).toBe(true);

      const aliceFinalRead = compiler.compile({ scope });
      expect(aliceFinalRead.entries).toHaveLength(4);
      expect(aliceFinalRead.entries.some((e) => e.entry.cid === "deploy.host")).toBe(true);

      const kinds = aliceFinalRead.entries.map((e) => e.entry.kind);
      expect(kinds).toEqual(["rule", "decision", "decision", "observation"]);
    });
  });

  describe("Scope fork and merge", () => {
    it("forks a scope with inheritance", () => {
      const store = server.store;
      const compiler = server.compiler;

      store.insert({
        scope: "project.parent",
        cid: "tech.stack",
        message: "Uses TypeScript.",
        kind: "decision",
        author: tokenAlice,
      });

      store.insert({
        scope: "project.parent.fork",
        cid: "_fork",
        message: "Forked from project.parent",
        kind: "observation",
        author: tokenAlice,
      });

      const forkContext = compiler.compile({ scope: "project.parent.fork" });
      expect(forkContext.entries).toHaveLength(2);
      expect(forkContext.stats.inherited).toBe(1);
    });
  });

  describe("Token generation and parsing", () => {
    it("generates and parses valid tokens", () => {
      const token = generateToken("project.myapp", "agent:test");
      const payload = parseToken(token);

      expect(payload.scope).toBe("project.myapp");
      expect(payload.permissions).toContain("read");
      expect(payload.permissions).toContain("write");
    });

    it("rejects malformed tokens", () => {
      expect(() => parseToken("bad-token")).toThrow();
      expect(() => parseToken("ctx_")).toThrow();
    });
  });
});