# Conflict Resolution in the Context Compiler

**How the Compiler resolves conflicting commitments — with worked examples.**

## The Two Sources of Conflict

Conflicts arise from two distinct mechanisms:

### 1. Divergent Supersession (within a scope)

Two agents independently write to the same `(scope, cid)` with different messages, and neither supersedes the other. Both entries remain active. The compiler detects this and returns both.

### 2. Scope Distribution (across scopes)

A parent scope and child scope both have entries for the same cid. The child overrides the parent. No conflict — this is intentional delegation.

---

## Resolution Rules (the Truth Model)

The compiler applies these rules, in order:

| Rule | What it does | Priority |
|------|-------------|----------|
| **Supersession** | If entry B explicitly supersedes entry A, A is marked `superseded` and dropped from output | 1 (highest) |
| **Scope override** | If scope `project.auth` has entry for cid X, it overrides any entry for X in `project` | 2 |
| **Conflict flagging** | If multiple entries for same cid within the same scope have no supersession relationship, both are returned and flagged | 3 |
| **Graceful degradation** | When over token budget, compress observations first, then decisions; never drop rules silently | 4 (lowest) |

---

## Worked Examples

### Example 1: Clean Supersession ✅

```
Entry A: cid="auth.provider" message="Use Supabase."  status="active"
Entry B: cid="auth.provider" message="Use Auth0."      supersedes=A
```

**Compiler output:** Entry B only. Entry A is dropped (superseded).

```
entries: [{ message: "Use Auth0.", provenance: { supersedesChain: ["sha256:B", "sha256:A"] } }]
conflicts: []
```

### Example 2: Real Conflict ⚠️

```
Agent Alice writes:  cid="db.orm" message="Use Prisma."
Agent Bob writes:    cid="db.orm" message="Use Drizzle."  (no supersedes)
```

Both entries are active. Neither supersedes the other. The compiler:

```
entries:
  - { message: "Use Prisma.",  provenance: { sourceScope: "project" } }
  - { message: "Use Drizzle.", provenance: { sourceScope: "project" } }
conflicts:
  - { cid: "db.orm", existingEntry: "Use Prisma.", incomingEntry: "Use Drizzle." }
```

**Downstream:** An agent reading this context sees both options and can decide which to follow, then resolve by writing a new entry with `supersedes` set to the id of the entry it disagrees with.

### Example 3: Scope Inheritance (intentional) ✅

```
Root scope "project":     cid="tech.stack" message="Uses TypeScript."
Child scope "project.auth":  cid="auth.provider" message="Uses Auth0."
```

Compiling `project.auth`:

```
entries:
  - { message: "Uses TypeScript.", provenance: { inherited: true,  fromParent: "project" } }
  - { message: "Uses Auth0.",      provenance: { inherited: false, fromParent: null } }
```

The child inherits the parent's tech.stack decision and adds its own auth.provider. No conflict.

### Example 4: Scope Override (intentional) ✅

```
Root scope "project":       cid="auth.provider" message="Use Supabase."
Child scope "project.auth": cid="auth.provider" message="Use Auth0."
```

Compiling `project.auth`:

```
entries:
  - { message: "Use Auth0.", provenance: { inherited: false, fromParent: null } }
stats: { overridden: 1 }
```

The child's entry for `auth.provider` overrides the parent's. The parent's entry is not included.

### Example 5: Token Budget — Graceful Degradation 🪣

Active set (6 entries, ~120 tokens total):

| Priority | Entry | Tokens |
|----------|-------|--------|
| Rule | `Must use parameterized queries.` | 6 |
| Decision | `Use Drizzle ORM.` | 5 |
| Decision | `Deploy on Vercel.` | 5 |
| Observation | `API averages 240ms response time.` | 8 |
| Observation | `Database has 15 tables.` | 6 |
| Observation | `Frontend uses React 19.` | 6 |

**Budget = 30 tokens:**

1. First pass: compress observations (keep first sentence, or truncate at 80 chars).
2. Second pass: if still over, drop observations starting with the least relevant.
3. Third pass: if still over, drop decisions (never drop rules).
4. All dropped entries are logged with reason `"budget"`.

```
entries: [rule, decision(Use Drizzle), decision(Deploy), ...compressed observations]
dropped: [
  { cid: "frontend", kind: "observation", reason: "budget" }
]
stats: { compressed: 2, dropped: 1 }
```

Rules are **never** dropped. Observations are compressed first, then dropped. Decisions are compressed second, then dropped. If somehow the budget is exceeded after dropping all observations and decisions, the compiler still returns what it can with an error budget stat.

### Example 6: Task Relevance Ranking 🎯

```
Task: "Add authentication to the API"
```

Entries ranked by keyword overlap:

1. `auth.provider` — "Uses Supabase RLS" → matches "authentication" (rank: 1)
2. `api.routing` — "Uses Next.js App Router" → matches "API" (rank: 1)
3. `tech.stack` — "Uses TypeScript" → no match (rank: 0)
4. `db.orm` — "Uses Drizzle" → no match (rank: 0)

Within same relevance score, kind ordering applies: rules first, then decisions, then observations.

---

## What Never Happens

| Scenario | Why impossible |
|----------|---------------|
| Circular supersession (A→B→A) | Append-only — A must exist before B can reference it |
| Superseding a superseded entry | Store rejects it: "target is already superseded" |
| Self-supersession | Store rejects it: "cannot supersede itself" |
| Rules dropped before observations | Compiler enforces kind priority — rules are always kept last |
| Silent drop without logging | Every dropped entry is recorded in `dropped[]` with reason |
| Cross-scope id collision | `computeId` includes scope in hash: `SHA256(scope + "." + cid + "." + message)` |

---

## How to Resolve a Conflict

When an agent receives a `Conflict` in the compiled output:

```
Option 1: Write a new entry with supersedes
  write({ cid: "db.orm", message: "Use Drizzle.",
          supersedes: "sha256:abc..." })
  → Entry B is now superseded. Conflict resolved.

Option 2: Acknowledge and move on
  Both entries remain active. Conflict persists.
  Next compile() returns both + conflict.

Option 3: Fork the scope and resolve separately
  fork("db.decision", "project")
  → Work in isolation, merge when decided.
```

The protocol does not auto-resolve conflicts. It surfaces them and lets agents or humans decide.