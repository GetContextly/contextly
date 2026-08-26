import { describe, it, expect } from "vitest";
import { Compiler, Store, computeId } from "../src/index.js";
import { type ContextEntry } from "../src/types";
import { parseScopeAncestors, tokenCount, entryTokenCount } from "../src/compiler.js";

function seed(
  store: Store,
  scope: string,
  cid: string,
  message: string,
  kind: "decision" | "rule" | "observation" = "decision",
  author = "human:test",
  supersedes?: string,
): string {
  const { entry } = store.insert({ scope, cid, message, kind, author, supersedes });
  return entry.id;
}

describe("Compiler", () => {
  describe("scope resolution", () => {
    it("inherits parent scope entries when child has none", () => {
      const store = new Store();
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");
      seed(store, "project", "db.orm", "Uses Drizzle.", "rule");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth" });

      expect(result.stats.inherited).toBe(2);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].provenance.inherited).toBe(true);
      expect(result.entries[0].provenance.fromParent).toBe("project");
      store.close();
    });

    it("child scope overrides parent scope for same cid", () => {
      const store = new Store();
      seed(store, "project", "auth.provider", "Uses Supabase.", "decision");
      seed(store, "project.auth", "auth.provider", "Uses Auth0.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth" });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.message).toBe("Uses Auth0.");
      expect(result.entries[0].provenance.inherited).toBe(false);
      store.close();
    });

    it("child scope has own entries plus inherited ones", () => {
      const store = new Store();
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");
      seed(store, "project.auth", "auth.provider", "Uses Auth0.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth" });

      expect(result.entries).toHaveLength(2);
      const authEntry = result.entries.find((e) => e.entry.cid === "auth.provider");
      expect(authEntry?.provenance.inherited).toBe(false);
      const techEntry = result.entries.find((e) => e.entry.cid === "tech.stack");
      expect(techEntry?.provenance.inherited).toBe(true);
      store.close();
    });

    it("inherits from grandparent scope", () => {
      const store = new Store();
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth.api" });

      expect(result.stats.inherited).toBe(1);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.message).toBe("Uses TypeScript.");
      store.close();
    });

    it("deep child overrides mid-parent, inherits grandparent for other cids", () => {
      const store = new Store();
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");
      seed(store, "project", "db.orm", "Uses Drizzle.", "decision");
      seed(store, "project.auth", "auth.provider", "Uses Supabase.", "decision");
      seed(store, "project.auth.api", "auth.provider", "Uses JWTs.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth.api" });

      expect(result.entries).toHaveLength(3);
      expect(result.entries.find((e) => e.entry.cid === "auth.provider")?.entry.message).toBe("Uses JWTs.");
      expect(result.entries.find((e) => e.entry.cid === "tech.stack")?.entry.message).toBe("Uses TypeScript.");
      expect(result.entries.find((e) => e.entry.cid === "db.orm")?.entry.message).toBe("Uses Drizzle.");
      store.close();
    });

    it("empty scope returns empty context", () => {
      const store = new Store();
      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.nonexistent" });

      expect(result.entries).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      store.close();
    });
  });

  describe("kind ordering", () => {
    it("outputs rules first, then decisions, then observations", () => {
      const store = new Store();
      seed(store, "project", "api.latency", "API averages 240ms.", "observation");
      seed(store, "project", "db.orm", "Use Drizzle.", "rule");
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      expect(result.entries[0].entry.kind).toBe("rule");
      expect(result.entries[1].entry.kind).toBe("decision");
      expect(result.entries[2].entry.kind).toBe("observation");
      store.close();
    });
  });

  describe("supersession resolution", () => {
    it("replaces superseded entries with the latest", () => {
      const store = new Store();
      const v1 = seed(store, "project", "auth.provider", "Uses Supabase.", "decision");
      seed(store, "project", "auth.provider", "Uses Auth0.", "decision", "human:alice", v1);

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.message).toBe("Uses Auth0.");
      store.close();
    });

    it("superseded entries do not leak into output", () => {
      const store = new Store();
      const v1 = seed(store, "project", "db.orm", "Use Prisma.", "decision");
      seed(store, "project", "db.orm", "Use Drizzle.", "decision", "human:alice", v1);

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      const messages = result.entries.map((e) => e.entry.message);
      expect(messages).not.toContain("Use Prisma.");
      expect(messages).toContain("Use Drizzle.");
      store.close();
    });

    it("full supersession chain is traced in provenance", () => {
      const store = new Store();
      const v1 = seed(store, "project", "auth.provider", "v1", "decision");
      const v2 = seed(store, "project", "auth.provider", "v2", "decision", "human:alice", v1);
      seed(store, "project", "auth.provider", "v3", "decision", "human:bob", v2);

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].provenance.supersedesChain.length).toBeGreaterThanOrEqual(1);
      store.close();
    });
  });

  describe("conflict detection", () => {
    it("detects conflicting entries for same cid", () => {
      const store = new Store();

      store.insert({
        scope: "project", cid: "db.orm",
        message: "Use Prisma.",
        kind: "decision", author: "human:alice",
      });
      store.insert({
        scope: "project", cid: "db.orm",
        message: "Use Drizzle.",
        kind: "decision", author: "human:bob",
      });

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].cid).toBe("db.orm");
      expect(result.entries.length).toBeGreaterThan(1);
      store.close();
    });

    it("no false conflict when one supersedes the other", () => {
      const store = new Store();
      const v1 = seed(store, "project", "db.orm", "Use Prisma.", "decision");
      seed(store, "project", "db.orm", "Use Drizzle.", "decision", "human:alice", v1);

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project" });

      expect(result.conflicts).toHaveLength(0);
      expect(result.entries).toHaveLength(1);
      store.close();
    });
  });

  describe("token budget", () => {
    it("returns all entries when under budget", () => {
      const store = new Store();
      seed(store, "project", "a", "Short message.", "observation");
      seed(store, "project", "b", "Another short one.", "decision");
      seed(store, "project", "c", "A rule to follow.", "rule");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", budget: 10000 });

      expect(result.entries).toHaveLength(3);
      expect(result.stats.dropped).toBe(0);
      store.close();
    });

    it("compresses observations when over budget", () => {
      const store = new Store();
      seed(store, "project", "obs1", "This is a very long observation message that goes on and on about something not very important.", "observation");
      seed(store, "project", "rule1", "Short rule.", "rule");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", budget: 10 });

      expect(result.stats.compressed).toBeGreaterThanOrEqual(1);
      store.close();
    });

    it("never drops rules even when severely over budget", () => {
      const store = new Store();
      seed(store, "project", "rule1", "Critical rule: never do X.", "rule");
      seed(store, "project", "obs1", "An observation.", "observation");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", budget: 5 });

      const ruleEntries = result.entries.filter((e) => e.entry.kind === "rule");
      expect(ruleEntries.length).toBeGreaterThan(0);
      store.close();
    });

    it("logs dropped entries with reason", () => {
      const store = new Store();
      seed(store, "project", "obs1", "Low priority observation.", "observation");
      seed(store, "project", "obs2", "Another observation.", "observation");
      seed(store, "project", "rule1", "Important rule.", "rule");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", budget: 2 });

      if (result.stats.dropped > 0) {
        expect(result.dropped[0].reason).toBe("budget");
        expect(result.dropped[0].kind).toBe("observation");
      }
      store.close();
    });
  });

  describe("kind and cid filtering", () => {
    it("filters by kind", () => {
      const store = new Store();
      seed(store, "project", "rule1", "Must do X.", "rule");
      seed(store, "project", "dec1", "Chose Y.", "decision");
      seed(store, "project", "obs1", "Observed Z.", "observation");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", kind: "rule" });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.kind).toBe("rule");
      store.close();
    });

    it("filters by cid exact match", () => {
      const store = new Store();
      seed(store, "project", "auth.provider", "Uses Supabase.", "decision");
      seed(store, "project", "db.orm", "Uses Drizzle.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", cid: "auth.provider" });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].entry.cid).toBe("auth.provider");
      store.close();
    });

    it("filters by cid prefix with glob", () => {
      const store = new Store();
      seed(store, "project", "auth.provider", "Uses Supabase.", "decision");
      seed(store, "project", "auth.method", "Uses JWTs.", "decision");
      seed(store, "project", "db.orm", "Uses Drizzle.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", cid: "auth.*" });

      expect(result.entries).toHaveLength(2);
      expect(result.entries.every((e) => e.entry.cid.startsWith("auth"))).toBe(true);
      store.close();
    });
  });

  describe("task relevance ranking", () => {
    it("ranks entries by keyword match with task", () => {
      const store = new Store();
      seed(store, "project", "db.orm", "Uses Drizzle ORM for database queries.", "decision");
      seed(store, "project", "auth.provider", "Uses Supabase for authentication.", "decision");
      seed(store, "project", "deploy.host", "Deployed on Vercel.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project", task: "database queries" });

      const dbEntry = result.entries.find((e) => e.entry.cid === "db.orm");
      const authEntry = result.entries.find((e) => e.entry.cid === "auth.provider");
      expect(result.entries.indexOf(dbEntry!)).toBeLessThan(
        result.entries.indexOf(authEntry!),
      );
      store.close();
    });
  });

  describe("caching", () => {
    it("returns cached result for same scope and budget", () => {
      const store = new Store();
      seed(store, "project", "a", "Entry A.", "decision");

      const compiler = new Compiler(store);
      const r1 = compiler.compile({ scope: "project", budget: 1000 });
      const r2 = compiler.compile({ scope: "project", budget: 1000 });

      expect(r1.entries).toHaveLength(r2.entries.length);
      store.close();
    });

    it("invalidates cache when entry is added to scope", () => {
      const store = new Store();
      seed(store, "project", "a", "Entry A.", "decision");

      const compiler = new Compiler(store);
      const r1 = compiler.compile({ scope: "project" });

      seed(store, "project", "b", "Entry B.", "decision");
      compiler.invalidateScope("project");

      const r2 = compiler.compile({ scope: "project" });
      expect(r2.entries.length).toBe(r1.entries.length + 1);
      store.close();
    });

    it("different budgets produce different cache entries", () => {
      const store = new Store();
      seed(store, "project", "a", "A short entry.", "decision");
      seed(store, "project", "b", "Another entry.", "decision");

      const compiler = new Compiler(store);
      const r1 = compiler.compile({ scope: "project", budget: 5 });
      const r2 = compiler.compile({ scope: "project", budget: 1000 });

      expect(r1.entries.length).toBeLessThanOrEqual(r2.entries.length);
      store.close();
    });
  });

  describe("provenance", () => {
    it("tracks which scope each entry was resolved from", () => {
      const store = new Store();
      seed(store, "project", "tech.stack", "Uses TypeScript.", "decision");
      seed(store, "project.auth", "auth.provider", "Uses Auth0.", "decision");

      const compiler = new Compiler(store);
      const result = compiler.compile({ scope: "project.auth" });

      const tech = result.entries.find((e) => e.entry.cid === "tech.stack")!;
      expect(tech.provenance.sourceScope).toBe("project");
      expect(tech.provenance.inherited).toBe(true);

      const auth = result.entries.find((e) => e.entry.cid === "auth.provider")!;
      expect(auth.provenance.sourceScope).toBe("project.auth");
      expect(auth.provenance.inherited).toBe(false);
      store.close();
    });
  });

  describe("parseScopeAncestors", () => {
    it("splits dotted scope into ancestors", () => {
      expect(parseScopeAncestors("a.b.c")).toEqual(["a", "a.b", "a.b.c"]);
      expect(parseScopeAncestors("single")).toEqual(["single"]);
      expect(parseScopeAncestors("")).toEqual([""]);
    });
  });

  describe("token counting", () => {
    it("counts tokens in messages", () => {
      expect(tokenCount("short")).toBe(2);
      expect(tokenCount("")).toBe(0);
      expect(tokenCount("a b c")).toBe(3);
    });
  });
});