import { describe, it, expect } from "vitest";
import { Store, computeId } from "../src/index.js";

function insertMany(
  store: Store,
  count: number,
  scope: string,
  baseCid = "test.key",
) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const { entry } = store.insert({
      cid: baseCid,
      message: `version ${i}`,
      kind: "decision",
      scope,
      author: "human:test",
      supersedes: i > 0 ? ids[i - 1] : undefined,
    });
    ids.push(entry.id);
  }
  return ids;
}

describe("DAG invariants", () => {
  describe("no cycles", () => {
    it("a chain of 100 supersessions has no cycles", () => {
      const store = new Store();
      let prevId: string | null = null;
      for (let i = 0; i < 100; i++) {
        const { entry } = store.insert({
          cid: "linear.chain",
          message: `step ${i}`,
          kind: "decision",
          scope: "dag.test",
          author: "human:test",
          supersedes: prevId,
        });
        prevId = entry.id;
      }

      const history = store.getHistory("dag.test", "linear.chain");
      expect(history).toHaveLength(100);

      expect(history[0].status).toBe("active");
      for (let i = 1; i < history.length; i++) {
        expect(history[i].status).toBe("superseded");
      }
      store.close();
    });

    it("parent references create a branching DAG (not supersession)", () => {
      const store = new Store();

      // Root entry
      const root = store.insert({
        cid: "arch.decision",
        message: "Use Postgres.",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
      });

      // Branch A derives from root (via parents, not supersedes)
      const branchA = store.insert({
        cid: "arch.decision",
        message: "Use Postgres with pgvector.",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
        supersedes: root.entry.id,
      });

      // Both reference root as parent
      expect(branchA.entry.supersedes).toBe(root.entry.id);
      expect(store.getById(root.entry.id)!.status).toBe("superseded");

      // The chain is intact
      const ancestors = store.getAncestors(branchA.entry.id);
      expect(ancestors.some((a) => a.id === root.entry.id)).toBe(true);
      store.close();
    });

    it("long supersession chain is traceable end-to-end", () => {
      const store = new Store();
      const ids = insertMany(store, 50, "dag.test", "traceable.key");

      // Descendants of the first entry
      const descendants = store.getDescendants(ids[0]);
      expect(descendants.length).toBeGreaterThan(0);

      // Ancestors of the last entry
      const ancestors = store.getAncestors(ids[49]);
      expect(ancestors.length).toBeGreaterThan(0);

      // The latest is active, everything else is superseded
      expect(store.getById(ids[49])!.status).toBe("active");
      for (let i = 0; i < 49; i++) {
        expect(store.getById(ids[i])!.status).toBe("superseded");
      }
      store.close();
    });
  });

  describe("impossibility of cycles in append-only DAG", () => {
    it("cycle detection is defense-in-depth; protocol prevents cycles structurally", () => {
      const store = new Store();

      // A → B → C chain
      const a = store.insert({
        cid: "cycle.test",
        message: "A",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
      });
      const b = store.insert({
        cid: "cycle.test",
        message: "B",
        kind: "decision",
        scope: "dag.test",
        author: "human:bob",
        supersedes: a.entry.id,
      });
      const c = store.insert({
        cid: "cycle.test",
        message: "C",
        kind: "decision",
        scope: "dag.test",
        author: "human:charlie",
        supersedes: b.entry.id,
      });

      // D tries to supersede C (forward reference — impossible to cycle)
      const d = store.insert({
        cid: "cycle.test",
        message: "D",
        kind: "decision",
        scope: "dag.test",
        author: "human:dave",
        supersedes: c.entry.id,
      });
      expect(d.entry.status).toBe("active");

      // D cannot also supersede A (already superseded by B)
      const act = () =>
        store.insert({
          cid: "cycle.test",
          message: "E",
          kind: "decision",
          scope: "dag.test",
          author: "human:eve",
          supersedes: a.entry.id,
        });
      expect(act).toThrow(/already superseded/);
      store.close();
    });
  });

  describe("immutability", () => {
    it("insert always creates a new entry, never overwrites", () => {
      const store = new Store();

      const { entry: e1 } = store.insert({
        cid: "immutable.test",
        message: "first",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
      });

      const { entry: e2 } = store.insert({
        cid: "immutable.test",
        message: "second",
        kind: "decision",
        scope: "dag.test",
        author: "human:bob",
        supersedes: e1.id,
      });

      expect(store.getById(e1.id)).not.toBeNull();
      expect(store.getById(e2.id)).not.toBeNull();

      // e1's message didn't change
      expect(store.getById(e1.id)!.message).toBe("first");

      // e1's id is deterministic
      expect(e1.id).toBe(computeId("dag.test", "immutable.test", "first"));
      store.close();
    });

    it("duplicate insert is rejected, preserving original", () => {
      const store = new Store();

      store.insert({
        cid: "immutable.test",
        message: "unique",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
      });

      const act = () =>
        store.insert({
          cid: "immutable.test",
          message: "unique",
          kind: "decision",
          scope: "dag.test",
          author: "human:bob",
        });
      expect(act).toThrow(/already exists/);

      expect(store.getAllEntries()).toHaveLength(1);
      store.close();
    });

    it("status transitions are forward-only", () => {
      const store = new Store();
      const { entry } = store.insert({
        cid: "status.test",
        message: "test",
        kind: "decision",
        scope: "dag.test",
        author: "human:alice",
      });

      expect(store.getById(entry.id)!.status).toBe("active");

      store.insert({
        cid: "status.test",
        message: "newer",
        kind: "decision",
        scope: "dag.test",
        author: "human:bob",
        supersedes: entry.id,
      });

      expect(store.getById(entry.id)!.status).toBe("superseded");

      // Cannot tombstone a superseded entry
      const act = () => store.tombstoneEntry(entry.id);
      expect(act).toThrow(/only active entries/);
      store.close();
    });
  });

  describe("supersession chains are traceable", () => {
    it("full chain is retrievable via getHistory", () => {
      const store = new Store();
      const ids = insertMany(store, 50, "dag.test", "traceable.key");

      const history = store.getHistory("dag.test", "traceable.key");
      expect(history).toHaveLength(50);

      expect(history[0].message).toBe("version 49");
      expect(history[49].message).toBe("version 0");
      store.close();
    });

    it("chain has exactly one active entry (the latest)", () => {
      const store = new Store();
      insertMany(store, 25, "dag.test", "active.count");

      const active = store.getActiveSet("dag.test");
      const entry = active.find((e) => e.cid === "active.count");
      expect(entry).toBeDefined();
      expect(entry!.message).toBe("version 24");
      expect(entry!.status).toBe("active");
      store.close();
    });

    it("all entries in chain except the latest are superseded", () => {
      const store = new Store();
      insertMany(store, 10, "dag.test", "superseded.count");

      const history = store.getHistory("dag.test", "superseded.count");
      const supersededCount = history.filter(
        (e) => e.status === "superseded",
      ).length;
      expect(supersededCount).toBe(9);
      store.close();
    });
  });

  describe("multi-tenant isolation", () => {
    it("ten scopes with identical content don't interfere", () => {
      const store = new Store();
      const scopeCount = 10;
      const entriesPerScope = 5;

      for (let s = 0; s < scopeCount; s++) {
        const scope = `tenant.${s}`;
        let prev: string | null = null;
        for (let e = 0; e < entriesPerScope; e++) {
          const { entry } = store.insert({
            cid: "test.key",
            message: `v${e}`,
            kind: "decision",
            scope,
            author: "human:alice",
            supersedes: prev,
          });
          prev = entry.id;
        }
      }

      for (let s = 0; s < scopeCount; s++) {
        const active = store.getActiveSet(`tenant.${s}`);
        expect(active).toHaveLength(1);
        expect(active[0].message).toBe("v4");
      }

      // scope is in the id now, so same cid+message in different scopes
      // produces different ids. Total entries = scopeCount * entriesPerScope.
      expect(store.getAllEntries()).toHaveLength(scopeCount * entriesPerScope);
      store.close();
    });

    it("scope-based queries never leak across tenants", () => {
      const store = new Store();

      // Write to tenant.a.critical
      store.insert({
        cid: "secret.key",
        message: "Admin password is changeme.",
        kind: "observation",
        scope: "tenant.a",
        author: "human:alice",
      });

      // Write to tenant.b.critical
      store.insert({
        cid: "secret.key",
        message: "Admin password is s3cret.",
        kind: "observation",
        scope: "tenant.b",
        author: "human:bob",
      });

      const aEntries = store.getActiveSet("tenant.a");
      const bEntries = store.getActiveSet("tenant.b");

      expect(aEntries).toHaveLength(1);
      expect(aEntries[0].message).toBe("Admin password is changeme.");

      expect(bEntries).toHaveLength(1);
      expect(bEntries[0].message).toBe("Admin password is s3cret.");
      store.close();
    });
  });

  describe("computeId", () => {
    it("produces deterministic hashes", () => {
      const a = computeId("scope.x", "test.cid", "test message");
      const b = computeId("scope.x", "test.cid", "test message");
      expect(a).toBe(b);
    });

    it("different messages produce different hashes", () => {
      const a = computeId("scope.x", "test.cid", "message one");
      const b = computeId("scope.x", "test.cid", "message two");
      expect(a).not.toBe(b);
    });

    it("different cids produce different hashes", () => {
      const a = computeId("scope.x", "cid.one", "same message");
      const b = computeId("scope.x", "cid.two", "same message");
      expect(a).not.toBe(b);
    });

    it("different scopes produce different hashes", () => {
      const a = computeId("scope.a", "test.cid", "same message");
      const b = computeId("scope.b", "test.cid", "same message");
      expect(a).not.toBe(b);
    });

    it("returns sha256: prefixed hex string", () => {
      const id = computeId("scope.x", "test", "test");
      expect(id).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });
});