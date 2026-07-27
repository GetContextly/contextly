# The Contextly Protocol

**Version 0.1 — July 2026**

Context is memory. Nothing more. Nothing less.

Contextly is a protocol that lets AI agents share memory in human-readable form — not vectors, not embeddings, not typed objects. Plain text that any agent can read, write, and pass forward.

---

## 1. Identity

Every context entry has two identifiers:

**`id`** — a content-addressed SHA256 hash of the entry's content + timestamp. This makes entries immutable and self-verifying. Same content at the same time always produces the same id.

**`cid`** — a human-readable canonical name, scoped to the workspace. Example: `ctx/auth/providers`, `ctx/arch/decisions/db`. These are soft references — they point to the latest entry with that name, resolved at read time.

That's it. Two identifiers: one for content addressing (immutable, verifiable), one for human/agent reference (mutable, convenient).

---

## 2. The Context Object

```
{
  id: string,              // SHA256(content + timestamp)
  cid: string,             // canonical name, e.g. "ctx/auth/provider"
  message: string,         // human-readable text. the actual memory.
  scope: string,           // workspace or sub-scope, e.g. "project:contextly"
  author: string,          // who wrote it: "agent:claude" | "human:alice"
  timestamp: string,       // ISO 8601
  parents: string[],       // ids of context this was derived from
  supersedes: string | null, // id of the context entry this replaces
  status: "active" | "superseded" | "archived"
}
```

The `message` field is the payload. Everything else is routing and lifecycle.

A context entry is not a structured proposition. It is a sentence:

```
"Authentication uses Supabase RLS with JWTs."
"The project structure is a Turborepo monorepo."
"We standardized on TypeScript strict mode."
```

---

## 3. Commitment Model

Eight operations. Each maps to a single state transition.

**Create**: A new entry is born with `status: "active"`. It must reference at least one parent (the context it extends or responds to), unless it is the root entry of a workspace.

**Branch**: A fork creates a new scope that inherits all active entries from the parent scope. No data is copied — the fork maintains a reference to the parent scope and overlays its own entries.

**Validate**: Before any entry is accepted, the protocol checks for conflicts — two active entries in the same scope with the same `cid` but different `message`. If a conflict exists, the entry is rejected with the conflicting entry's id.

**Activate**: An entry becomes active upon successful validation. Active entries are visible to all agents reading the scope.

**Supersede**: An entry supersedes another by setting `supersedes` to the old entry's id. The old entry's status becomes `"superseded"`. The superseding entry becomes the active value for that `cid`.

**Resolve**: When two entries conflict (same `cid`, different `message`, both active), a resolver must choose which one wins. The loser gets `status: "superseded"`. The resolver can be:
- A human (always authoritative)
- An agent with explicit authority
- Automated rule: higher author priority, or later timestamp

**Archive**: Entries with no active descendants and age > 90 days can be archived. Archived entries are excluded from default queries but remain in the graph.

**Merge**: Entries from a branch are incorporated into the target scope. Each incoming entry is validated against the target scope's active entries. Conflicts are flagged for resolution.

---

## 4. Graph Model

The graph is a DAG.

- **Nodes** are context entries.
- **Edges** are `parents[]` references (derivation) and `supersedes` (replacement).
- **Traversal** is walking the DAG via parent references, or following the supersession chain for a single `cid`.
- **The active set** for a scope is: all entries where `status = "active"`, deduplicated by `cid` so only the latest non-superseded entry for each cid is included.
- **Query** is: "give me all active entries for scope X" — returns a list of messages. Simple.
- **Inheritance**: A scope inherits all active entries from its parent scope, unless a child-scope entry has the same `cid` (which means the child overrides).
- **Branching**: A branch is a new scope referencing a parent scope. It starts with the parent's active set as its baseline.

---

## 5. Truth Model

When two contexts disagree:

1. **The superseded entry is not truth.** If one entry explicitly supersedes another, the superseding entry wins.
2. **The most recent entry wins.** If neither supersedes the other, the later timestamp wins.
3. **Human authority > agent authority.** If same timestamp, human-authored entries beat agent-authored entries.
4. **If still tied, both remain active and a conflict is flagged for human resolution.**

Multiple truths can coexist in different scopes (branch A can have a different truth than branch B). Within a single scope, there is exactly one truth per `cid` — the active, non-superseded entry with the most recent timestamp.

---

## 6. Synchronization

**Local state**: Each workspace maintains an append-only log of entries (JSON lines file or SQLite). The log is append-only — entries are never modified after creation.

**Cloud state**: A relay that stores the canonical log for each workspace. Not a source of truth — a distribution point.

**Agent state**: An agent maintains its own log of entries it has authored or received. On connect, it pulls the workspace log and reconciles with its local state.

**Human state**: Humans interact through the same protocol. A CLI command, a file in the repo, a commit message. Same entries, same format.

**Offline mode**: Entries are created locally, timestamped, and synced when connected. Because entries are content-addressed and immutable, sync is idempotent — same entry hashed the same way produces no conflict.

**Conflict resolution**: A conflict exists when two entries in the same scope have the same `cid` but different `message`, and neither `supersedes` the other. Resolution requires a new entry with `supersedes` set.

---

## 7. Agent Protocol

An AI agent interacts with Contextly in three phases:

### Before reasoning: RECEIVE

The agent receives the active context set for its scope. This is a list of messages:

```
"Authentication uses Supabase RLS with JWTs."
"The project structure is a Turborepo monorepo."
"We standardized on TypeScript strict mode."
"We decided against Prisma — using Drizzle instead."
```

The agent processes these as part of its context window. It does not need to parse structured data — just read the messages.

### During reasoning: CREATE

As the agent makes decisions, it notes them as context entries:

```
message: "API routes use Next.js App Router with route handlers."
cid: "ctx/api/routing"
supersedes: null
```

The agent can create multiple entries during a session. Each is buffered locally.

### After reasoning: COMMIT

At session end (or periodically), the agent commits its entries:

1. Send each entry to the workspace log.
2. The protocol validates each entry for conflicts.
3. If no conflicts, the entry is accepted and propagated.
4. If a conflict exists, the agent is notified and must either withdraw or supersede.

---

## 8. API Primitives

The entire protocol is five operations:

```
read(scope)    → ContextEntry[]
  Returns the active context for a scope. Messages only, by default.

write(entry)   → ContextEntry | ConflictError
  Submits a context entry. Returns the entry on success, or a conflict error.

fork(scope, parentScope) → Scope
  Creates a new scope that inherits from a parent.

merge(source, target)    → MergeResult
  Incorporates entries from source scope into target scope.

resolve(cid, supersedingId, scope) → ContextEntry
  Resolves a conflict by declaring one entry as the superseder.
```

That's it. Five primitives. Every other capability (history, search, diff, export) is derived from these.

---

## Appendix: Wire Format

All entries are JSON-LD — JSON with an `@context` field for extensibility.

```json
{
  "@context": "https://contextly.dev/v0.1",
  "id": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "cid": "ctx/auth/provider",
  "message": "Authentication uses Supabase RLS with JWTs.",
  "scope": "project:contextly",
  "author": "agent:claude",
  "timestamp": "2026-07-27T10:00:00Z",
  "parents": ["sha256:abc..."],
  "supersedes": null,
  "status": "active"
}
```

---

**Context is memory. Memory is text. Text is shared.**

This is the entire protocol. Everything else is implementation.