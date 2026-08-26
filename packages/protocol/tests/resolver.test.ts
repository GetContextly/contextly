import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store, Compiler, ConflictResolver, authorityLevel } from "../src/index";
import type { ContextEntry } from "../src/index";

function seed(
  store: Store,
  scope: string,
  cid: string,
  message: string,
  kind: "decision" | "rule" | "observation" = "decision",
  author = "agent:alice",
  supersedes?: string,
): string {
  const { entry } = store.insert({ scope, cid, message, kind, author, supersedes });
  return entry.id;
}

/** Ensure a ≥5ms gap between sequential seeds so timestamps differ */
async function seedDelayed(
  store: Store,
  scope: string,
  cid: string,
  message: string,
  kind: "decision" | "rule" | "observation" = "decision",
  author = "agent:alice",
): Promise<string> {
  await new Promise((r) => setTimeout(r, 10));
  return seed(store, scope, cid, message, kind, author);
}

describe("ConflictResolver", () => {
  let store: Store;
  let compiler: Compiler;
  let resolver: ConflictResolver;

  beforeEach(() => {
    store = new Store();
    compiler = new Compiler(store);
    resolver = new ConflictResolver(store, compiler);
  });

  afterEach(() => {
    store.close();
  });

  // ─── 1. Detection surface ─────────────────────────────────────

  describe("detection surface", () => {
    it("returns empty for clean scope", () => {
      expect(resolver.getConflicts("project.x")).toHaveLength(0);
    });

    it("detects divergent conflicts from store", () => {
      seed(store, "project.x", "db.orm", "Use Prisma.", "decision", "agent:alice");
      seed(store, "project.x", "db.orm", "Use Drizzle.", "decision", "agent:bob");

      const c = resolver.getConflicts("project.x");
      expect(c).toHaveLength(1);
      expect(c[0].cid).toBe("db.orm");
      expect(c[0].type).toBe("divergent");
      expect(c[0].source).toBe("store");
      expect(c[0].status).toBe("unresolved");
    });

    it("filters by cid", () => {
      seed(store, "project.x", "db.orm", "P.", "decision", "agent:a");
      seed(store, "project.x", "db.orm", "D.", "decision", "agent:b");
      seed(store, "project.x", "auth.provider", "S.", "decision", "agent:a");
      seed(store, "project.x", "auth.provider", "A.", "decision", "agent:b");

      expect(resolver.getConflictsForCid("project.x", "db.orm")).toHaveLength(1);
      expect(resolver.getConflictsForCid("project.x", "auth.provider")).toHaveLength(1);
    });

    it("getAllUnresolvedConflicts excludes auto-resolved", async () => {
      seed(store, "project.x", "key", "A.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "key", "B.", "decision", "agent:bob");
      expect(resolver.getAllUnresolvedConflicts("project.x")).toHaveLength(1);
      resolver.autoResolve("project.x");
      expect(resolver.getAllUnresolvedConflicts("project.x")).toHaveLength(0);
    });
  });

  // ─── 2. Auto-resolution ───────────────────────────────────────

  describe("authority rule", () => {
    it("human beats agent", () => {
      seed(store, "project.x", "auth.provider", "Use Supabase.", "decision", "agent:alice");
      seed(store, "project.x", "auth.provider", "Use Auth0.", "decision", "human:bob");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("authority");
      expect(store.getByScopeAndCid("project.x", "auth.provider")).toHaveLength(1);
      expect(store.getByScopeAndCid("project.x", "auth.provider")[0].message).toBe("Use Auth0.");
    });

    it("named agent beats anonymous", () => {
      seed(store, "project.x", "key", "Anonymous choice.", "rule", "anonymous");
      seed(store, "project.x", "key", "Named choice.", "rule", "agent:claude");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("authority");
      expect(store.getByScopeAndCid("project.x", "key")[0].message).toBe("Named choice.");
    });
  });

  describe("recency rule", () => {
    it("later timestamp wins when authority tied", async () => {
      seed(store, "project.x", "tech.stack", "Use TypeScript.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "tech.stack", "Use JavaScript.", "decision", "agent:bob");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("recency");
      expect(store.getByScopeAndCid("project.x", "tech.stack")[0].message).toBe("Use JavaScript.");
    });
  });

  describe("confidence rule", () => {
    it("higher confidence wins when all other rules tied", () => {
      const store2 = new Store();
      const compiler2 = new Compiler(store2);
      const r2 = new ConflictResolver(store2, compiler2, {
        confidenceFn: (e: ContextEntry) => (e.message.includes("high") ? 0.9 : 0.5),
      });

      seed(store2, "project.x", "key", "low message", "decision", "agent:alice");
      seed(store2, "project.x", "key", "high message", "decision", "agent:bob");

      // Normalize timestamps so recency is truly tied
      store2.getDb().prepare("UPDATE entries SET timestamp = ?").run("2024-01-01T00:00:00.000Z");

      const result = r2.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("confidence");
      expect(store2.getByScopeAndCid("project.x", "key")[0].message).toBe("high message");
    });
  });

  describe("multi-entry conflicts", () => {
    it("resolves 3-way — authority breaks tie regardless of order", () => {
      // All get same-ms timestamps; authority determines winner
      seed(store, "project.x", "framework", "Use React.", "decision", "agent:alice");
      seed(store, "project.x", "framework", "Use Vue.", "decision", "agent:bob");
      seed(store, "project.x", "framework", "Use Svelte.", "decision", "human:carol");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("authority");
      expect(store.getByScopeAndCid("project.x", "framework")[0].message).toBe("Use Svelte.");
    });

    it("resolves 3-way — recency breaks tie when authority tied", async () => {
      await seedDelayed(store, "project.x", "framework", "Use React.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "framework", "Use Vue.", "decision", "agent:bob");
      await seedDelayed(store, "project.x", "framework", "Use Svelte.", "decision", "agent:charlie");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);
      expect(result.resolutions[0].rule.name).toBe("recency");
      expect(result.resolutions[0].supersededIds).toHaveLength(2);
      expect(store.getByScopeAndCid("project.x", "framework")[0].message).toBe("Use Svelte.");
    });
  });

  describe("idempotency", () => {
    it("running autoResolve twice is safe — second call finds nothing to resolve", async () => {
      seed(store, "project.x", "key", "First.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "key", "Second.", "decision", "agent:bob");

      const first = resolver.autoResolve("project.x");
      expect(first.resolved).toBe(1);

      const second = resolver.autoResolve("project.x");
      expect(second.total).toBe(0);
      expect(second.resolved).toBe(0);
    });
  });

  // ─── 3. Manual resolution ─────────────────────────────────────

  describe("manual resolution", () => {
    it("resolves by superseding a conflicting entry", () => {
      const idA = seed(store, "project.x", "db.orm", "Use Prisma.", "decision", "agent:alice");
      seed(store, "project.x", "db.orm", "Use Drizzle.", "decision", "agent:bob");

      const newEntry = resolver.manualResolve({
        scope: "project.x", cid: "db.orm",
        message: "Use Drizzle with extensions.", kind: "decision",
        author: "human:alice", supersedingId: idA,
      });

      expect(newEntry.status).toBe("active");
      expect(newEntry.supersedes).toBe(idA);
      expect(store.getById(idA)!.status).toBe("superseded");

      const active = store.getByScopeAndCid("project.x", "db.orm");
      expect(active).toHaveLength(2);
      expect(active.map((e) => e.message)).toContain("Use Drizzle with extensions.");
    });

    it("throws if target does not exist", () => {
      expect(() =>
        resolver.manualResolve({
          scope: "project.x", cid: "key",
          message: "Resolution.", kind: "decision",
          author: "human:alice", supersedingId: "nonexistent",
        }),
      ).toThrow("Supersedes target nonexistent does not exist");
    });
  });

  // ─── 4. Escalation policy ─────────────────────────────────────

  describe("escalation policy", () => {
    it("humans can always resolve without policy", () => {
      expect(resolver.canResolve("human:alice", "project.x")).toBe(true);
    });
    it("agents cannot resolve without policy", () => {
      expect(resolver.canResolve("agent:claude", "project.x")).toBe(false);
    });
    it("agents in owner list can resolve", () => {
      expect(resolver.canResolve("agent:c", "project.x", { owner: ["agent:c"], admins: [], delegates: [] })).toBe(true);
    });
    it("agents in admin list can resolve", () => {
      expect(resolver.canResolve("agent:d", "project.x", { owner: ["human:a"], admins: ["agent:d"], delegates: [] })).toBe(true);
    });
    it("agents in delegate list can resolve", () => {
      expect(resolver.canResolve("agent:r", "project.x", { owner: ["human:a"], admins: [], delegates: ["agent:r"] })).toBe(true);
    });
    it("unlisted agents cannot resolve", () => {
      expect(resolver.canResolve("agent:i", "project.x", { owner: ["human:a"], admins: [], delegates: [] })).toBe(false);
    });
    it("anonymous never resolves even if listed", () => {
      expect(resolver.canResolve("anonymous", "project.x", { owner: ["anonymous"], admins: [], delegates: [] })).toBe(false);
    });
  });

  // ─── 5. Feedback loop ─────────────────────────────────────────

  describe("feedback loop", () => {
    it("records and retrieves feedback", async () => {
      seed(store, "project.x", "key", "A.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "key", "B.", "decision", "agent:bob");

      const result = resolver.autoResolve("project.x");
      expect(result.resolved).toBe(1);

      resolver.recordFeedback({
        conflictId: result.resolutions[0].conflictId,
        autoResolutionEntryId: result.resolutions[0].supersedingEntryId,
        disagreed: true,
        notes: "Wrong — should have picked B",
        recordedBy: "human:alice",
      });

      const fb = resolver.getFeedback(result.resolutions[0].conflictId);
      expect(fb).not.toBeNull();
      expect(fb!.disagreed).toBe(true);
      expect(fb!.notes).toBe("Wrong — should have picked B");
    });

    it("getStats tracks feedback", async () => {
      seed(store, "project.x", "k1", "A1.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "k1", "B1.", "decision", "agent:bob");
      const r1 = resolver.autoResolve("project.x");

      seed(store, "project.x", "k2", "A2.", "decision", "agent:alice");
      await seedDelayed(store, "project.x", "k2", "B2.", "decision", "agent:bob");
      const r2 = resolver.autoResolve("project.x");

      resolver.recordFeedback({
        conflictId: r1.resolutions[0].conflictId,
        autoResolutionEntryId: r1.resolutions[0].supersedingEntryId,
        disagreed: true,
        recordedBy: "human:alice",
      });
      resolver.recordFeedback({
        conflictId: r2.resolutions[0].conflictId,
        autoResolutionEntryId: r2.resolutions[0].supersedingEntryId,
        disagreed: false,
        recordedBy: "human:alice",
      });

      const stats = resolver.getStats("project.x");
      expect(stats.autoResolved).toBe(2);
      expect(stats.feedbackDisagreements).toBe(1);
      expect(stats.feedbackAgreements).toBe(1);
    });
  });

  // ─── authorityLevel helper ────────────────────────────────────

  describe("authorityLevel", () => {
    it("human: → 3", () => expect(authorityLevel("human:alice")).toBe(3));
    it("agent:name → 2", () => expect(authorityLevel("agent:claude")).toBe(2));
    it("agent:anonymous → 1", () => expect(authorityLevel("agent:anonymous")).toBe(1));
    it("'anonymous' → 0", () => expect(authorityLevel("anonymous")).toBe(0));
    it("unknown → 0", () => expect(authorityLevel("unknown:string")).toBe(0));
  });

  // ─── Multi-scope isolation ────────────────────────────────────

  describe("multi-scope isolation", () => {
    it("conflicts in one scope do not affect another", async () => {
      seed(store, "scope.a", "key", "A.", "decision", "agent:alice");
      await seedDelayed(store, "scope.a", "key", "A diff.", "decision", "agent:bob");
      seed(store, "scope.b", "key", "B.", "decision", "agent:alice");

      expect(resolver.getConflicts("scope.a")).toHaveLength(1);
      expect(resolver.getConflicts("scope.b")).toHaveLength(0);

      resolver.autoResolve("scope.a");
      expect(resolver.getConflicts("scope.a")).toHaveLength(0);
      expect(resolver.getConflicts("scope.b")).toHaveLength(0);
    });
  });
});