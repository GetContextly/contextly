# Contextly System Architecture

**Version 0.2 — July 2026**

This document describes the complete system architecture for the Contextly Protocol. It assumes familiarity with the protocol specification (`PROTOCOL.md`).

---

## 1. Storage Architecture

### Problem

The protocol defines entries as JSON objects in an append-only log. Physical storage must support:

- Append new entries (write-heavy, no updates)
- Point lookup by SHA256 id
- Lookup by (scope, cid) for the active entry
- Scan by scope for all active entries
- History traversal by (scope, cid) for all versions
- Conflict detection (multiple active entries for same scope + cid)

### Option Analysis

| System | Append | Point Lookup | Scope+CID | Scope Scan | DAG Walk | Verdict |
|--------|--------|-------------|-----------|-----------|----------|---------|
| Postgres | OK (INSERT) | PK index | Composite B-tree | B-tree | Recursive CTE | Works but fights append-only model |
| Neo4j | OK | Label+index | Label+index | Label scan | Natural | Overkill — edges are just references |
| MongoDB | OK (_id as hash) | Embedded | Compound index | Index scan | $graphLookup | Works, heavy dependency |
| IPFS | Natural | Content routing | No | No | No | Wrong abstraction |
| SQLite | INSERT | PK index | Composite B-tree | B-tree | Recursive CTE | Ideal for local/edge |
| JSON Lines file | Append-only | grep/scan | No | No | No | Trivial but no indexing |

### Decision

**SQLite for local/edge. Object store + thin index for cloud relay.**

SQLite is the right choice because:
- Zero infrastructure — ships embedded in every agent and CLI
- Single-file — easy to sync, backup, transfer
- Hash index on id for O(1) point lookups
- Composite B-tree on (scope, cid, timestamp DESC) for active set queries and history
- Recursive CTEs for DAG traversal via parents[] and supersedes
- Transactions for atomic append + conflict detection
- Battle-tested at every scale from phones to satellites

### Local Schema

```sql
CREATE TABLE entries (
    id          TEXT PRIMARY KEY,          -- sha256:hex
    cid         TEXT NOT NULL,             -- dotted path
    message     TEXT NOT NULL,             -- the memory
    kind        TEXT NOT NULL CHECK(kind IN ('decision','rule','observation')),
    scope       TEXT NOT NULL,             -- dotted path
    author      TEXT NOT NULL,             -- type:name
    timestamp   TEXT NOT NULL,             -- ISO 8601, protocol-assigned
    parents     TEXT DEFAULT '[]',         -- JSON array of id strings
    supersedes  TEXT,                      -- nullable id reference
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK(status IN ('active','superseded','archived','tombstoned')),
    created_at  TEXT DEFAULT (datetime('now'))  -- local write time
);

-- Active set lookup: which entry for (scope, cid) is currently active?
CREATE INDEX idx_active ON entries(scope, cid, timestamp DESC)
    WHERE status = 'active';

-- Scope scan: everything active in this scope
CREATE INDEX idx_scope_active ON entries(scope, timestamp DESC)
    WHERE status = 'active';

-- Supersession chain: find entries that supersede a given id
CREATE INDEX idx_supersedes ON entries(supersedes)
    WHERE supersedes IS NOT NULL;

-- History: all versions of (scope, cid) in order
CREATE INDEX idx_history ON entries(scope, cid, timestamp DESC);

-- Conflict detection: count active entries grouped by (scope, cid)
-- (uses idx_active)
```

### Active Set Query

```sql
-- All active entries for a scope (including inherited from parent)
SELECT e.* FROM entries e
WHERE e.scope = :scope
  AND e.status = 'active'
  AND e.id = (
      SELECT e2.id FROM entries e2
      WHERE e2.scope = e.scope
        AND e2.cid = e.cid
        AND e2.status = 'active'
      ORDER BY e2.timestamp DESC
      LIMIT 1
  );
```

If this returns multiple entries for the same cid, those entries are in conflict.

### Cloud Relay Storage

The cloud stores two things:

1. **Raw log**: Append-only JSON Lines file in S3/GCS. Partitioned by scope and date. This is the canonical record.

2. **Index table** (DynamoDB or similar): Thin mapping for sync operations.

```
Table: entries
  PK: scope               # partition key
  SK: timestamp#id        # sort key
  Attributes: cid, kind, status

Table: active_set
  PK: scope#cid           # partition key
  SK: timestamp           # sort key (latest = active)
  Attributes: message, kind, author, id
```

The cloud does NOT compute the active set on read. The active set is computed client-side. The cloud only stores and distributes.

### Why Not Postgres

Postgres would work. But it introduces a server dependency for what should be a local-first operation. With SQLite, every agent has a complete, queryable copy of its workspace state. No network call needed for read(). No server dependency for offline writes. Postgres at the relay layer adds latency, operational overhead, and a single point of failure that a local-first architecture deliberately avoids.

---

## 2. Distributed Architecture

### 100 Users — Single Team

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Agent A     │     │  Agent B     │     │  Human       │
│  SQLite DB   │     │  SQLite DB   │     │  CLI + SQLite│
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Cloud Relay   │
                    │  S3 + DynamoDB │
                    │  (single table)│
                    └────────────────┘
```

Every participant has a full local SQLite copy of the workspace log. Writes go to the relay, which appends to S3 and updates the index. Participants poll or subscribe for new entries.

Relay cost: ~$5/month. Negligible.

### 10k Users — Multiple Teams, Multiple Scopes

```
┌──────────┐ ┌──────────┐ ┌──────────┐      ┌──────────┐
│Team A    │ │Team B    │ │Team C    │ ...  │Team N    │
│agents    │ │agents    │ │agents    │      │agents    │
└────┬─────┘ └────┬─────┘ └────┬─────┘      └────┬─────┘
     │            │            │                 │
     └────────────┼────────────┼─────────────────┘
                  │            │
          ┌───────▼────────────▼────────┐
          │      Cloud Relay           │
          │  S3 (partitioned by scope) │
          │  DynamoDB (index + cache)  │
          │  Redis (hot active sets)   │
          └────────────────────────────┘
```

Scopes provide natural partitioning. Each scope's log is an independent S3 prefix. DynamoDB handles cross-scope queries (admin, search). Redis caches frequently-read active sets.

Agents subscribe only to scopes they're members of. A developer in Team A does not sync Team B's log.

Relay cost: ~$200/month. Cache layer absorbs read traffic.

### 1M Users — Organizations

```
┌──────────────────────────────────────────────┐
│            Organization Relay                │
│  (self-hosted or managed, per org)           │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │Scope A  │  │Scope B  │  │Scope C  │     │
│  │S3 prefix│  │S3 prefix│  │S3 prefix│     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │  Federation Gateway             │       │
│  │  (cross-org references & sync)  │       │
│  └──────────────────────────────────┘       │
└──────────────────────────────────────────────┘
         │                    │
         │                    │
┌────────▼────────┐  ┌────────▼────────┐
│  Org B Relay    │  │  Org C Relay    │
│  (isolated)     │  │  (isolated)     │
└─────────────────┘  └─────────────────┘
```

Each organization runs its own relay (or uses a managed multi-tenant version). Cross-org context sharing is explicit — org A publishes a scope, org B subscribes. The federation gateway handles authentication and access control for cross-org references.

Relay cost per org: ~$1,000/month. Federation gateway: shared infrastructure.

### 100M Users — Federated Global Fabric

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Team Relay   │  │  Team Relay   │  │  Team Relay   │
│  (edge)       │  │  (edge)       │  │  (edge)       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
              ┌───────────▼────────────┐
              │   Global Relay Mesh   │
              │   (p2p between orgs,  │
              │   CDN for public logs)│
              └───────────────────────┘
```

No central relay. Organizations peer directly. Each edge relay caches active sets from the scopes its agents follow. The CDN serves public-scope active sets globally.

At this scale, the active set is never computed from the full log — it's maintained as a materialized snapshot per scope, updated on each write. The snapshot is served from CDN. Write volume per scope is low (humans + agents make bounded decisions), so the snapshot is cheap to maintain.

Key insight: **context writes are rare.** A team of 10 developers + 10 agents might make 50 context entries per day. Even at 100M users, total daily write volume across all scopes is in the millions — trivial for a CDN-backed materialized view.

---

## 3. Retrieval Architecture

No vector search. No embeddings. No semantic similarity. The protocol does not model meaning — it models decisions.

### Three Retrieval Modes

#### Mode A: Active Set Scan

```
read(scope: "project.contextly")
→ [Entry, Entry, Entry, ...]
```

Return every active entry for the scope. This is the default retrieval mode — used when an agent starts a session and needs full context.

**Implementation**: SQL query against the local SQLite `idx_scope_active` index. Returns all entries with `status = 'active'` for the scope, deduplicated by cid (latest timestamp wins unless there's a conflict).

**Cost**: O(n) where n = active entries in scope. For a typical project, n < 200. This fits in a single context window.

#### Mode B: Filtered Scan

```
read(scope: "project.contextly", kind: "rule")
read(scope: "project.contextly", cid: "auth.*")
read(scope: "project.contextly", kind: "decision", cid: "db.*")
```

Return a subset of the active set filtered by kind or cid prefix. Used when an agent needs a specific category of context without consuming tokens on the rest.

**Implementation**: SQL query against `idx_active` with additional WHERE clauses on `kind` and `cid LIKE pattern`. Same index, same path, narrower result.

**Cost**: O(m) where m = matching entries. Usually < 50.

#### Mode C: Point Lookup

```
read(scope: "project.contextly", cid: "auth.provider")
→ Entry (or Conflict)
```

Return the single active entry for a specific cid. Used when an agent needs to check one specific decision.

**Implementation**: SQL query against `idx_active` with exact cid match. Returns the latest active entry for that (scope, cid). If multiple entries match (conflict), returns both.

**Cost**: O(1) — hash lookup.

### Token Optimization

The active set returned by `read()` is plain text sentences. For a scope with 200 active entries at ~100 tokens each, the active set consumes ~20k tokens — well within any modern model's context window (200k+).

For larger scopes (unlikely — context is sparse by nature), agents filter by kind or cid prefix before including in context.

### History

```
history(scope: "project.contextly", cid: "auth.provider")
→ [Entry_v1, Entry_v2, Entry_v3, ...]
```

Returns all entries for a cid, ordered by timestamp, regardless of status. Used for audit and understanding how a decision evolved.

**Implementation**: SQL query against `idx_history` index. Returns the full DAG for that (scope, cid).

---

## 4. Context Compiler

The Context Compiler transforms the raw append-only log into the active context set that agents receive.

### Input

Raw entries from the local SQLite log. These are unvalidated, unordered, and include entries in all statuses (`active`, `superseded`, `archived`, `tombstoned`).

### Processing

The compiler runs five passes:

```
Pass 1: Scope Filter
  Include only entries matching the requested scope.
  Include parent scope entries unless overridden.

Pass 2: Status Filter
  Include only entries with status = "active".

Pass 3: CID Deduplication
  Group remaining entries by cid.
  For each cid with multiple entries:
    - If one supersedes the other(s), keep the superseding entry
    - If no supersession chain, this is a CONFLICT — keep all

Pass 4: Inheritance Resolution
  For each cid in the result set:
    - If the parent scope has an entry for this cid
    - AND the child scope does NOT have an entry for this cid
    - Inherit the parent's entry
    - If the child scope has an entry, it overrides the parent's

Pass 5: Ordering
  Sort by (kind, cid) for deterministic output.
  Rules first, then decisions, then observations.
```

### Output

```typescript
{
  entries: ContextEntry[],    // the active set
  conflicts: Conflict[],      // any unresolved conflicts
  inherited: number,          // count of inherited entries
  overrides: number           // count of overridden entries
}
```

The entries array is ready for agent consumption — plain text sentences that can be injected into a context window.

### Validation (Write Path)

When `write()` is called, the compiler runs two checks:

1. **Duplicate check**: Does an entry with this id already exist? Computed as SHA256(cid + "." + message). If yes, reject — this exact context is already recorded.

2. **Conflict check**: Does this entry conflict with an existing active entry? Same scope + same cid + different message + neither supersedes the other? If yes, accept the entry but flag the conflict. Both entries remain active.

3. **Supersession validation**: If `supersedes` is set, does the target id exist? If not, reject. If the target is already superseded by another entry, reject — you can't supersede a superseded entry. You must supersede the active one.

### Edge Cases

- **Self-supersession**: An entry cannot supersede itself. Reject.
- **Circular supersession**: A -> B -> A is impossible because entries are immutable. A cannot reference B if B references A, because A must exist before B can reference it. The protocol's append-only nature prevents cycles.
- **Orphan parents**: `parents[]` can reference entries that don't exist locally (e.g., from a scope the agent hasn't synced). These are allowed. The parent reference is informational, not a hard constraint.
- **Empty scope**: A scope with no entries has an empty active set. The agent receives nothing. This is correct — no context has been established yet.

---

## 5. Sync Engine

### Architecture

The sync engine is the equivalent of `git push` / `git pull` for context entries.

```
┌──────────────────┐          ┌──────────────────┐
│  Local Agent     │          │  Cloud Relay     │
│                  │          │                  │
│  SQLite DB       │ ◄──────► │  S3 Log + Index  │
│  entries table   │  sync    │                  │
│  sync_state table│          │  scopes/{scope}/ │
└──────────────────┘          │  entries.jsonl   │
                              └──────────────────┘
```

### Local Sync State

```sql
CREATE TABLE sync_state (
    scope       TEXT PRIMARY KEY,
    last_sync   TEXT NOT NULL,        -- ISO 8601
    last_entry  TEXT NOT NULL,         -- id of last synced entry
    status      TEXT DEFAULT 'synced' CHECK(status IN ('synced','pending','conflict'))
);
```

### Push

```
1. Agent submits write() → entry is validated and added to local SQLite
2. Agent marks entry as unsynced in a pending_entries table
3. On sync trigger (periodic / explicit):
   a. Read all pending entries for the scope
   b. POST them to the cloud relay's /push endpoint
   c. Relay appends to S3 log, updates index
   d. Relay responds with confirmed timestamps
   e. Agent updates sync_state
```

The relay's `/push` endpoint is idempotent. If an entry already exists (same id), the relay ignores the duplicate and returns success. No locking needed.

### Pull

```
1. Agent calls the relay's /pull endpoint with its last_sync timestamp
2. Relay returns all entries appended after that timestamp
3. Agent processes each entry:
   a. Compute id = SHA256(cid + "." + message)
   b. Check if id already exists in local SQLite
   c. If not, insert the entry
   d. If yes, skip (deduplication)
4. Agent updates sync_state
5. Agent re-runs the Context Compiler to update the active set
6. Agent checks for new conflicts
```

### Branch

A branch is a logical operation, not a data copy.

```
fork(scope: "feature.x", parentScope: "project.main")
→ returns scope "feature.x"
```

The relay registers `feature.x` as a child of `project.main`. No entries are copied. When `feature.x` is read, the compiler inherits `project.main`'s active set and overlays `feature.x`'s own entries.

Storage cost of a fork: one row in a `scopes` table.

### Merge

```
merge(source: "feature.x", target: "project.main")
→ MergeResult
```

The merge engine:

```
1. Read all entries in source scope with status = "active"
2. For each entry:
   a. Check: does target scope have an entry for same (scope, cid)?
   b. If no entry in target → adopt (INSERT into target log)
   c. If entry exists in target with same message → skip (duplicate)
   d. If entry exists in target with different message → CONFLICT
3. Return MergeResult { adopted, conflicts, rejected }
```

Conflicts must be resolved before the merge can complete. The merge is atomic — either all entries are adopted or none are (with conflicts returned to the caller).

### Conflict Detection During Sync

Conflicts can arise during pull when two agents independently write to the same (scope, cid) with different messages and neither supersedes the other.

The sync engine detects this on the pull side:

```
1. New entry arrives via pull: (scope="project", cid="auth.provider", message="Use Firebase")
2. Local active set has: (scope="project", cid="auth.provider", message="Use Supabase")
3. Neither supersedes the other → CONFLICT
4. Local SQLite marks both as active
5. Compiler returns both entries for this cid
6. Conflict is visible on next read()
```

### Offline Sync

Offline writes are timestamped with the agent's local clock and stored in the local SQLite with `created_at` set. On reconnection:

1. Push all offline entries to the relay
2. Pull all entries missed while offline
3. The relay handles ordering (relay-assigned timestamp takes precedence over local timestamp)
4. Compiler resolves any conflicts

---

## 6. Security Architecture

### Authentication

Agents and humans authenticate to the relay using **workspace-scoped API tokens**.

```
Token format: ctx_{workspace_id}_{random_32_bytes_base64}
Token payload (server-side): { scope: "project.contextly", permissions: ["read","write"], author: "agent:claude" }
```

Tokens are issued by the relay on workspace creation. There is no global auth key. Every token is bound to a specific scope.

**Token validation**:
1. Parse the token prefix to identify the workspace
2. Decode the random portion and look up the token in the relay's token store
3. Verify the token's scope matches the request scope
4. Check the token's permissions against the requested operation

### Authorization

Access control is scope-based. A token grants access to exactly one scope (and its child scopes).

```
Permissions:
  read     → read(scope) and point lookups
  write    → write(entry) within the scope
  resolve  → resolve(scope, cid, supersedingId)
  fork     → fork(scope, parentScope)
  merge    → merge(source, target)
```

Permission inheritance: `write` implies `read`. `resolve` implies `write`. `merge` implies `read` on both source and target.

### Tenant Isolation

Tenant = scope hierarchy.

```
org.acme.team-payments
org.acme.team-payments.sprint-23
org.acme.team-identity
```

A token scoped to `org.acme.team-payments` cannot read `org.acme.team-identity`. Child scopes inherit permissions from parent scopes.

Cross-scope references require either:
- A token with access to both scopes, OR
- The source scope publishing the entry (see Cross-Scope References below)

### Agent Permissions

Agents are identified by `author: "agent:<name>"`. Humans by `author: "human:<name>"`.

The protocol does not distinguish between agent and human at the storage layer. Both create entries in the same format. The distinction matters only in the truth model (human resolutions take priority over agent resolutions) and in the authority system.

Authority levels:
```
Level 0: unauthenticated (author: "anonymous")
Level 1: agent (author: "agent:gpt-4")
Level 2: named agent (author: "agent:claude-code")
Level 3: human (author: "human:alice")
```

When resolving conflicts, higher-authority entries take precedence.

### Context Poisoning Prevention

Context poisoning — injecting false or misleading context — is mitigated at three layers:

**Layer 1: Authentication**
Only authenticated agents with valid workspace tokens can write. An attacker cannot write to a scope they don't have access to.

**Layer 2: Content Addressing**
Every entry is content-addressed. An attacker cannot modify an existing entry — the id would change, and the new entry would be independent. The old entry remains in the graph with its original id. Consumers can always verify that an entry's id matches its content.

**Layer 3: Conflict Detection**
If an attacker writes a contradictory entry, the compiler detects a conflict. Both entries are returned on read(). The agent or human reading the scope sees both versions and can decide which to trust.

**Layer 4: Auditability**
Every entry is timestamped and authored. The full history of every cid is available. Trust is reconstructable — given a compromised scope, you can replay the log and identify exactly when the poisoning occurred and by which author.

### Auditability

The append-only log is the audit trail.

For any (scope, cid):
```
history("project.contextly", "auth.provider")
→ [
    { message: "Use Supabase", author: "human:alice", timestamp: "2026-01-01", status: "superseded" },
    { message: "Use Firebase", author: "agent:gpt-4", timestamp: "2026-06-01", status: "active" }
  ]
```

This shows exactly when the decision changed, by whom, and what the previous decision was. Because entries are immutable and the log is append-only, this history cannot be altered.

For security-critical scopes, the relay can sign each entry with its private key before appending to the log, providing cryptographic proof of log integrity.

---

## 7. Developer Experience

### SDK (TypeScript)

```typescript
import { Contextly } from '@contextly/sdk';

const ctx = new Contextly({
  scope: 'project.myapp',
  token: process.env.CONTEXTLY_TOKEN,
  author: 'agent:claude'
});

// Read active context
const { entries, conflicts } = await ctx.read();

// Filter by kind
const rules = await ctx.read({ kind: 'rule' });

// Point lookup
const auth = await ctx.read({ cid: 'auth.provider' });

// Write new context
await ctx.write({
  cid: 'auth.provider',
  message: 'Authentication uses Supabase RLS with JWTs.',
  kind: 'decision'
});

// Fork and merge
const feature = await ctx.fork('feature.payment-redesign');
// ... work in feature scope ...
const result = await ctx.merge('feature.payment-redesign', 'project.myapp');
```

SDK packages:
- `@contextly/sdk` — core SDK (TypeScript, browser + Node)
- `@contextly/sdk-python` — Python SDK
- `@contextly/sdk-go` — Go SDK

### CLI

```bash
# Initialize a project scope
contextly init

# Show active context
contextly read
contextly read --kind rule
contextly read --cid auth.provider

# Add context
contextly write --cid auth.provider \
  --message "Authentication uses Supabase RLS" \
  --kind decision

# Fork and merge
contextly fork feature.x
contextly merge feature.x

# Show conflicts
contextly conflicts

# Resolve a conflict
contextly resolve --cid auth.provider --supersede <id>

# Show history
contextly history --cid auth.provider

# Sync
contextly push
contextly pull
```

### MCP Server

The MCP server exposes the five API primitives as MCP tools:

```
Tools:
  read(scope, kind?, cid?)          → entries[]
  write(cid, message, kind, scope)   → entry
  fork(scope, parentScope)           → scope
  merge(source, target)              → result
  resolve(scope, cid, supersedingId) → entry
```

Agents connect to the MCP server via stdio or HTTP. The MCP server embeds the SQLite database and the Context Compiler. No external dependencies.

```json
{
  "mcpServers": {
    "contextly": {
      "command": "npx",
      "args": ["@contextly/mcp-server"],
      "env": {
        "CONTEXTLY_SCOPE": "project.myapp",
        "CONTEXTLY_TOKEN": "ctx_abc123..."
      }
    }
  }
}
```

### REST API

Thin HTTP wrapper around the five primitives. JSON in, JSON out.

```
POST   /v0.2/read                  { scope, kind?, cid? }
POST   /v0.2/write                 { cid, message, kind, scope, author, parents?, supersedes? }
POST   /v0.2/fork                  { scope, parentScope }
POST   /v0.2/merge                 { source, target }
POST   /v0.2/resolve               { scope, cid, supersedingId }
```

Every endpoint authenticates via `Authorization: Bearer <token>`. Responses are standard JSON with a `data` or `error` field.

### Language Support

| Language | Package | Status |
|----------|---------|--------|
| TypeScript | `@contextly/sdk` | Primary. Full support. |
| Python | `contextly-sdk` | Core primitives. |
| Go | `github.com/contextly/sdk-go` | Core primitives. |

Additional languages (Rust, Java, Ruby) are community-maintained. The protocol specification is the source of truth.

### Quick Start

```bash
# 1. Install
npx @contextly/cli init

# 2. Create a workspace
contextly init --scope project.myapp

# 3. Add context
contextly write \
  --cid tech.stack \
  --message "The project uses TypeScript, Next.js, and Supabase." \
  --kind decision

# 4. Read context (any agent can now see it)
contextly read
```

The init command creates a `.contextly/` directory with:
- `scope` — the scope name
- `db.sqlite` — the local SQLite database
- `log.jsonl` — the raw JSON Lines log

That's it. No daemon, no server, no configuration beyond a scope name and an optional token.

---

## 8. Open Source Strategy

### What is Open Source

| Component | License | Rationale |
|-----------|---------|-----------|
| Protocol specification | CC0 (public domain) | Must be free for anyone to implement |
| SDKs (TS, Python, Go) | Apache 2.0 | Adoption depends on frictionless integration |
| CLI | Apache 2.0 | Primary on-ramp for developers |
| MCP Server | Apache 2.0 | Agents need this to connect |
| SQLite engine | Apache 2.0 | Core local-first logic, no reason to hide |
| Context Compiler | Apache 2.0 | Necessary for anyone implementing the protocol |

### What is Hosted (Paid)

| Component | Pricing Model | Why Hosted |
|-----------|--------------|------------|
| Cloud Relay | Per-workspace / usage | Stores and distributes the log. Requires storage, bandwidth, uptime. |
| Federation Gateway | Per-org | Cross-org sync, access control, audit. Enterprise feature. |
| Conflict Resolution UI | Included with relay | Web UI for viewing and resolving conflicts. Requires a server. |
| Audit Export | Per-query | Full log export for compliance. Compute-heavy. |

### What Creates the Moat

**The network, not the code.**

The protocol is open. Anyone can implement it. The moat is:

1. **The collective context graph.** A team with 1,000 context entries across 20 projects has invested in their context graph. Switching costs are high because the context is accumulated knowledge.

2. **Agent integrations.** Once an agent platform (Claude Code, Cursor, Copilot) ships Contextly support, users expect it to work. The integration becomes a standard.

3. **The relay network.** Self-hosting a relay is possible. But managed relays provide reliability, uptime, and cross-org federation that self-hosting doesn't. For most teams, the managed relay is worth paying for.

4. **Protocol ecosystem.** SDKs, tools, CI integrations, IDE plugins — the ecosystem around the protocol creates lock-in. Not because the protocol is proprietary, but because the tooling is convenient.

### Anti-Moat (What We Give Away)

- The protocol: anyone can fork it
- The local engine: runs entirely offline, no server needed
- The file format: JSON Lines, trivially portable
- Data portability: `cp .contextly/db.sqlite anywhere` — your context moves with you

If we try to lock data in, we lose. The moat must be the network and the ecosystem, not the data format.

---

**Context is memory. Memory is text. Text is shared.**

This is the architecture. Everything else is implementation.