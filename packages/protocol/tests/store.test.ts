import { describe, it, expect } from "vitest";
import { Store, computeId, StoreError } from "../src/index.js";

describe("Store", () => {
  describe("insert", () => {
    it("inserts an entry and assigns id + timestamp", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "auth.provider",
        message: "Authentication uses Supabase RLS.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      expect(entry.id).toBe(
        computeId("project.test", "auth.provider", "Authentication uses Supabase RLS."),
      );
      expect(entry.cid).toBe("auth.provider");
      expect(entry.message).toBe("Authentication uses Supabase RLS.");
      expect(entry.kind).toBe("decision");
      expect(entry.scope).toBe("project.test");
      expect(entry.author).toBe("human:alice");
      expect(entry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(entry.parents).toEqual([]);
      expect(entry.supersedes).toBeNull();
      expect(entry.status).toBe("active");
      store.close();
    });

    it("rejects duplicate entries", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const act = () =>
        store.insert({
          cid: "auth.provider",
          message: "Use Supabase.",
          kind: "decision",
          scope: "project.test",
          author: "human:alice",
        });
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/already exists/);
      store.close();
    });

    it("accepts parents as optional", () => {
      const store = new Store();
      const parent = store.insert({
        cid: "db.choice",
        message: "We chose Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const child = store.insert({
        cid: "auth.provider",
        message: "Auth uses Supabase RLS.",
        kind: "decision",
        scope: "project.test",
        author: "agent:claude",
        parents: [parent.entry.id],
      });

      expect(child.entry.parents).toEqual([parent.entry.id]);
      store.close();
    });

    it("rejects invalid kind", () => {
      const store = new Store();
      const act = () =>
        store.insert({
          cid: "test",
          message: "test",
          kind: "invalid" as never,
          scope: "project.test",
          author: "human:alice",
        });
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/Invalid kind/);
      store.close();
    });
  });

  describe("supersede", () => {
    it("marks target as superseded on insert with supersedes", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const second = store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      expect(second.entry.status).toBe("active");
      expect(second.entry.supersedes).toBe(first.entry.id);

      const firstAfter = store.getById(first.entry.id)!;
      expect(firstAfter.status).toBe("superseded");
      store.close();
    });

    it("rejects supersedes targeting a non-existent entry", () => {
      const store = new Store();
      const act = () =>
        store.insert({
          cid: "auth.provider",
          message: "Use Supabase.",
          kind: "decision",
          scope: "project.test",
          author: "human:alice",
          supersedes: "sha256:nonexistent",
        });
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/does not exist/);
      store.close();
    });

    it("rejects self-supersede", () => {
      const store = new Store();
      const act = () =>
        store.insert({
          cid: "auth.provider",
          message: "Use Supabase.",
          kind: "decision",
          scope: "project.test",
          author: "human:alice",
          supersedes: computeId("project.test", "auth.provider", "Use Supabase."),
        });
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/cannot supersede itself/);
      store.close();
    });

    it("rejects superseding an already-superseded entry", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      const act = () =>
        store.insert({
          cid: "auth.provider",
          message: "Use Neon.",
          kind: "decision",
          scope: "project.test",
          author: "human:charlie",
          supersedes: first.entry.id,
        });
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/already superseded/);
      store.close();
    });
  });

  describe("lookups", () => {
    it("getById returns entry or null", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "test",
        message: "test",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      expect(store.getById(entry.id)?.id).toBe(entry.id);
      expect(store.getById("sha256:nonexistent")).toBeNull();
      store.close();
    });

    it("getByScopeAndCid returns active entries", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const active = store.getByScopeAndCid("project.test", "auth.provider");
      expect(active).toHaveLength(1);
      expect(active[0].message).toBe("Use Firebase.");
      store.close();
    });

    it("getActiveSet returns deduplicated active entries per cid", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      store.insert({
        cid: "db.orm",
        message: "Use Drizzle.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      const active = store.getActiveSet("project.test");
      expect(active).toHaveLength(2);
      const auth = active.find((e) => e.cid === "auth.provider");
      expect(auth?.message).toBe("Use Supabase.");
      store.close();
    });

    it("getHistory returns all versions in order", () => {
      const store = new Store();
      const v1 = store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const v2 = store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: v1.entry.id,
      });

      // v3 supersedes v2 (the active one), not v1 (already superseded)
      store.insert({
        cid: "auth.provider",
        message: "Use Neon.",
        kind: "decision",
        scope: "project.test",
        author: "human:charlie",
        supersedes: v2.entry.id,
      });

      const history = store.getHistory("project.test", "auth.provider");
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe("Use Neon."); // latest first
      expect(history[1].message).toBe("Use Supabase.");
      expect(history[2].message).toBe("Use Firebase.");
      store.close();
    });
  });

  describe("conflict detection", () => {
    it("detects conflict when two entries differ and neither supersedes", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const result = store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
      });

      expect(result.conflict).not.toBeNull();
      expect(result.conflict!.cid).toBe("auth.provider");
      expect(result.conflict!.existingEntry.message).toBe("Use Firebase.");
      expect(result.conflict!.incomingEntry.message).toBe("Use Supabase.");
      store.close();
    });

    it("does not flag conflict when supersedes is set", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const result = store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      expect(result.conflict).toBeNull();

      const firstAfter = store.getById(first.entry.id)!;
      expect(firstAfter.status).toBe("superseded");
      store.close();
    });

    it("getConflicts returns all unresolved conflicts", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
      });

      store.insert({
        cid: "db.orm",
        message: "Use Drizzle.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const conflicts = store.getConflicts("project.test");
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].cid).toBe("auth.provider");
      store.close();
    });
  });

  describe("lifecycle transitions", () => {
    it("archives an entry", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "test",
        message: "test",
        kind: "observation",
        scope: "project.test",
        author: "human:alice",
      });

      store.archiveEntry(entry.id);
      const archived = store.getById(entry.id)!;
      expect(archived.status).toBe("archived");
      store.close();
    });

    it("tombstones an entry (redacts message, preserves DAG)", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "secret",
        message: "API key is sk-1234.",
        kind: "observation",
        scope: "project.test",
        author: "human:alice",
      });

      store.tombstoneEntry(entry.id);

      const tombstoned = store.getById(entry.id)!;
      expect(tombstoned.status).toBe("tombstoned");
      expect(tombstoned.message).toBe("");
      expect(tombstoned.cid).toBe("secret");
      expect(tombstoned.id).toBe(entry.id);
      store.close();
    });

    it("rejects tombstone on non-active entry", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "test",
        message: "test",
        kind: "observation",
        scope: "project.test",
        author: "human:alice",
      });

      store.archiveEntry(entry.id);

      const act = () => store.tombstoneEntry(entry.id);
      expect(act).toThrow(StoreError);
      expect(act).toThrow(/only active entries/);
      store.close();
    });
  });

  describe("DAG traversal", () => {
    it("getAncestors follows supersedes chain backward", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "v1: Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const second = store.insert({
        cid: "auth.provider",
        message: "v2: Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      const ancestors = store.getAncestors(second.entry.id);
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe(first.entry.id);
      store.close();
    });

    it("getDescendants follows supersedes chain forward", () => {
      const store = new Store();
      const first = store.insert({
        cid: "auth.provider",
        message: "v1: Use Firebase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      store.insert({
        cid: "auth.provider",
        message: "v2: Use Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:bob",
        supersedes: first.entry.id,
      });

      const descendants = store.getDescendants(first.entry.id);
      expect(descendants).toHaveLength(1);
      expect(descendants[0].message).toBe("v2: Use Supabase.");
      store.close();
    });

    it("getAncestors follows parents when no supersedes", () => {
      const store = new Store();
      const parent = store.insert({
        cid: "db.choice",
        message: "We chose Supabase.",
        kind: "decision",
        scope: "project.test",
        author: "human:alice",
      });

      const child = store.insert({
        cid: "auth.provider",
        message: "Auth uses RLS.",
        kind: "decision",
        scope: "project.test",
        author: "agent:claude",
        parents: [parent.entry.id],
      });

      const ancestors = store.getAncestors(child.entry.id);
      expect(ancestors.some((a) => a.id === parent.entry.id)).toBe(true);
      store.close();
    });
  });

  describe("multi-tenant isolation", () => {
    it("scopes are isolated", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "org.alpha",
        author: "human:alice",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "org.beta",
        author: "human:bob",
      });

      const alpha = store.getActiveSet("org.alpha");
      const beta = store.getActiveSet("org.beta");

      expect(alpha).toHaveLength(1);
      expect(alpha[0].message).toBe("Use Supabase.");

      expect(beta).toHaveLength(1);
      expect(beta[0].message).toBe("Use Firebase.");
      store.close();
    });

    it("same cid+message in different scopes is allowed", () => {
      const store = new Store();
      store.insert({
        cid: "tech.stack",
        message: "Use React.",
        kind: "decision",
        scope: "org.projectA",
        author: "human:alice",
      });

      store.insert({
        cid: "tech.stack",
        message: "Use React.",
        kind: "decision",
        scope: "org.projectB",
        author: "human:bob",
      });

      expect(store.getActiveSet("org.projectA")).toHaveLength(1);
      expect(store.getActiveSet("org.projectB")).toHaveLength(1);
      expect(store.getAllEntries()).toHaveLength(2);
      store.close();
    });

    it("conflicts are scoped", () => {
      const store = new Store();
      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "org.alpha",
        author: "human:alice",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Firebase.",
        kind: "decision",
        scope: "org.alpha",
        author: "human:bob",
      });

      store.insert({
        cid: "auth.provider",
        message: "Use Supabase.",
        kind: "decision",
        scope: "org.beta",
        author: "human:alice",
      });

      const alphaConflicts = store.getConflicts("org.alpha");
      const betaConflicts = store.getConflicts("org.beta");

      expect(alphaConflicts).toHaveLength(1);
      expect(betaConflicts).toHaveLength(0);
      store.close();
    });

    it("deleteScope removes all entries for that scope", () => {
      const store = new Store();
      store.insert({
        cid: "test",
        message: "alpha entry",
        kind: "decision",
        scope: "org.alpha",
        author: "human:alice",
      });

      store.insert({
        cid: "test",
        message: "beta entry",
        kind: "decision",
        scope: "org.beta",
        author: "human:bob",
      });

      const deleted = store.deleteScope("org.alpha");
      expect(deleted).toBe(1);

      expect(store.getScopes()).toEqual(["org.beta"]);
      store.close();
    });

    it("scopeExists returns correct values", () => {
      const store = new Store();
      expect(store.scopeExists("org.alpha")).toBe(false);

      store.insert({
        cid: "test",
        message: "test",
        kind: "decision",
        scope: "org.alpha",
        author: "human:alice",
      });

      expect(store.scopeExists("org.alpha")).toBe(true);
      expect(store.scopeExists("org.beta")).toBe(false);
      store.close();
    });
  });
});