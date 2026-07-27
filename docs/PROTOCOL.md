# The Contextly Protocol

**Version 0.2 — July 2026**

Context is memory — human-readable text that agents pass forward.

Not vectors. Not embeddings. Not typed objects. Sentences.

---

## 1. Identity

Every context entry has a single identity: its **content hash**.

```
id = SHA256(cid + "." + message)
```

The hash is purely the content — no timestamps, no metadata. This means:
- Same message under the same cid always produces the same id — true deduplication
- Anyone can verify an entry's integrity without trusting the sender
- Agents can reference entries by id without needing to coordinate a naming authority

There is no secondary identifier. No UUIDs, no sequential IDs, no human-readable names as pointers. If you need to reference an entry, you reference its hash.

---

## 2. The Context Object

```
{
  id: string,              // SHA256(cid + "." + message)
  cid: string,             // dotted-path, e.g. "auth.provider"
  message: string,         // human-readable text. the actual memory.
  kind: string,            // "decision" | "rule" | "observation"
  scope: string,           // dotted-path, e.g. "project.contextly"
  author: string,          // "agent:claude" | "human:alice"
  timestamp: string,       // ISO 8601
  parents: string[],       // ids this entry derives from (0 or more)
  supersedes: string | null, // id of the entry this replaces
  status: "active" | "superseded" | "archived" | "tombstoned"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | auto | Content hash. Not submitted — computed by the protocol. |
| `cid` | yes | Dotted-path. Determines the key this entry lives under. |
| `message` | yes | The memory. Plain text. One sentence. |
| `kind` | yes | What kind of memory: decision, rule, or observation. |
| `scope` | yes | Which workspace or sub-scope this belongs to. |
| `author` | yes | Who created this. Agents and humans use the same format. |
| `timestamp` | auto | Set by the protocol on acceptance, not by the submitter. |
| `parents` | no | Zero or more ids this entry was derived from. |
| `supersedes` | no | If set, marks the target entry as superseded. |
| `status` | auto | Set by the protocol based on lifecycle state. |

### The `message` field

A context entry is a sentence, not a document:

```
"The project uses Supabase RLS for authentication."
"The database schema uses UUIDs for primary keys."
"Prefer Drizzle over Prisma for new queries."
"Tests must pass before merge."
```

### The `kind` field

Three kinds, three purposes:

- **`decision`**: A choice that was made. "We chose Supabase over Firebase."
- **`rule`**: A constraint that must be followed. "No direct database access from client code."
- **`observation`**: A fact observed about the system. "The API averages 240ms response time."

Kinds matter for querying. An agent that wants rules does not want to see every observation.

### The `scope` field

Scopes are dotted-path hierarchies:

```
project.contextly
project.contextly.auth
project.contextly.api
org.acme.payments
```

A scope inherits all entries from its parent scope unless overridden.

### The `cid` field

The canonical identifier within a scope. Dotted-path convention:

```
auth.provider
auth.method
db.orm
arch.rules.testing
```

Cid namespaces are flat within a scope — there is no sub-cid hierarchy. If you need organization, use `scope` for that.

---

## 3. Commitment Model

### Lifecycle

```
                 ┌─────────────┐
                 │   DRAFT     │  (agent-local, not yet submitted)
                 └──────┬──────┘
                        │ submit
                 ┌──────▼──────┐
          ┌──────│   ACTIVE    │
          │      └──────┬──────┘
          │             │
     ┌────▼───┐   ┌────▼──────┐
     │TOMB-   │   │SUPERSEDED │
     │STONED  │   └───────────┘
     └────────┘
```

**Create**: An agent drafts an entry with `cid`, `message`, `kind`, `scope`, `author`, and optional `parents` and `supersedes`. The `id` and `timestamp` are assigned by the protocol upon acceptance.

**Submit**: The draft is submitted to the protocol. The protocol:
1. Computes `id = SHA256(cid + "." + message)`
2. Checks for duplicates (same id already exists → reject)
3. Checks for conflicts (same scope + same cid + different message + no supersedes → conflict)
4. If `supersedes` is set, validates the target id exists and marks it `"superseded"`
5. Sets `timestamp` to current time
6. Sets `status` to `"active"`
7. Appends the entry to the log

**Validate**: Validation is always automatic. No approval step. If an entry passes conflict check and duplicate check, it is accepted. There is no gatekeeper — the protocol is trustless at the validation layer. Trust is handled by the truth model and by consumers choosing which authors to trust.

**Supersede**: An entry supersedes another by setting `supersedes` to the target's id. The protocol marks the target as `status: "superseded"`. The superseding entry becomes the active value for that `cid` in that `scope`.

Supersession is explicit. Recency alone does not supersede. An entry with a later timestamp that contradicts an earlier entry but does not set `supersedes` creates a conflict — both remain active and must be resolved.

**Conflict**: Two entries in the same scope with the same `cid`, different `message`, and neither `supersedes` the other. Both remain `"active"`. A conflict is recorded. The scope now has two truths for that cid.

**Resolve**: A new entry is submitted that `supersedes` one of the conflicting entries. The resolver can be a human, an authorized agent, or an automated rule. The resolution entry itself follows the same validation rules.

**Archive**: An entry with `status: "active"` that has not been read or referenced in 90 days can be archived. Archived entries are excluded from default queries but remain in the graph. Archival is automatic.

**Tombstone**: An entry can be tombstoned to redact its message while preserving its position in the DAG. A tombstoned entry has `status: "tombstoned"` and `message: ""`. The id, cid, parents, and supersedes references remain intact — the graph structure is preserved. Tombstoning is the only destructive operation and should be reserved for cases where the message contains sensitive information.

**Merge**: When merging scope B into scope A, each entry from B is validated against A's active set. Entries with no conflicts are adopted. Entries with conflicts are flagged and must be resolved before the merge completes.

---

## 4. Graph Model

### Nodes and edges

- **Nodes** are context entries
- **Edges** are `parents[]` (derivation) and `supersedes` (replacement)

```
Entry A (auth.provider) ──parent──► Entry B (db.choice)
Entry C (auth.provider) ──supersedes──► Entry A
```

### Active set

The active set for a scope is computed as:

```
for each cid in scope:
    entries = all entries with status = "active"
    if multiple active entries for the same cid:
        this is a conflict — both are returned
    else:
        return the single active entry
```

### Inheritance

A scope inherits the active set of its parent. When an entry exists in both the parent and the child for the same `cid`, the child's entry takes precedence (override, not conflict).

### Traversal

- **By cid**: `get(scope, cid)` returns the active entry for that cid in that scope (or a conflict if unresolved).
- **By scope**: `read(scope)` returns the complete active set for that scope.
- **By id**: `get(id)` returns the entry regardless of status.
- **History**: `history(scope, cid)` returns all entries for that cid, ordered by timestamp, including superseded and archived entries.
- **Derivation**: `parents(id)` walks the DAG backward through parent references to trace how a decision was reached.

### Branching

A branch creates a new scope that inherits from a parent scope. All entries in the branch are validated only against the branch's scope. The parent scope is unaffected.

---

## 5. Truth Model

When two entries disagree:

1. **Explicit supersession wins.** If entry B sets `supersedes` to entry A's id, B is truth and A is not. This is the only way to change truth within a scope.

2. **Conflict means no truth.** If two entries have the same cid, different messages, and neither supersedes the other, the protocol does not decide. Both are active. A resolver must choose.

3. **Authority breaks ties in conflicts.** When resolving a conflict:
   - **Humans over agents**: a human's resolution supersedes an agent's
   - **Named agents over anonymous**: an agent with an explicit author id supersedes an unauthenticated entry
   - **Recency breaks remaining ties**: later timestamp wins

4. **Certainty does not exist.** The protocol does not model confidence scores, probability, or decay. An entry is either truth or it is not. Certainty is an application-layer concern.

5. **Multiple truths exist in different scopes.** Branch A can have a different auth.provider than the main scope. This is not a bug — it is parallel exploration.

6. **Multiple truths within the same scope is a conflict.** A conflict is not an error — it is a signal that a human needs to decide.

---

## 6. Synchronization

### All state is local

Every participant maintains a local append-only log. The log contains every entry the participant has ever seen for the scopes they follow. The log format is JSON lines — one entry per line, appended to a file.

### Cloud as relay

The cloud stores the canonical log for each scope. It is a relay, not a source of truth:
- Accepts new entries from any authenticated participant
- Distributes new entries to subscribed participants
- Stores the authoritative log for disaster recovery
- Does NOT compute the active set — that is done locally

### Agent state

An agent's local log has three sections:
1. **Authored**: entries the agent created
2. **Inherited**: entries received from the workspace
3. **Seen**: entries the agent has read but not authored

On connect, the agent:
1. Pulls entries from the cloud log that it doesn't have locally (by comparing entry ids)
2. Appends them to its local log
3. Recomputes the active set for each scope it follows

### Offline mode

Entries created offline are timestamped with the agent's local clock and submitted when connectivity returns. Because entries are content-addressed, the same entry submitted by two agents produces the same id — deduplication is automatic.

The agent's local clock timestamp is preserved as a `created` field. The protocol's acceptance timestamp is `timestamp`. Both are available for ordering decisions.

### Conflict resolution during sync

When a participant pulls entries during sync, conflicts are detected locally:
- Same scope, same cid, different message, neither supersedes the other
- The conflict is recorded in the participant's local state
- The participant's active set now shows both entries as active for that cid
- The conflict persists until a resolution entry is synced

---

## 7. Agent Protocol

An AI agent interacts with Contextly through the five API primitives. The interaction pattern has three phases.

### Before reasoning: RECEIVE

```
read(scope: "project.contextly") → ContextEntry[]
```

The agent receives the active context set for its scope. This is an array of entries, each with a message:

```
{ cid: "auth.provider",    message: "Authentication uses Supabase RLS with JWTs.",    kind: "decision" }
{ cid: "project.structure", message: "The project is a Turborepo monorepo.",           kind: "decision" }
{ cid: "db.orm",           message: "Prefer Drizzle over Prisma for new queries.",     kind: "rule" }
{ cid: "api.latency",      message: "The API averages 240ms response time.",           kind: "observation" }
```

The agent injects these messages into its context window. It can filter by `kind` if it only wants rules, or by `cid` prefix if it only wants auth-related entries.

The agent does not need to parse structured data — the messages are plain sentences.

### During reasoning: CREATE

As the agent makes decisions, it notes them as entries:

```
cid: "api.routing"
message: "API routes use Next.js App Router with route handlers."
kind: "decision"
scope: "project.contextly"
parents: ["sha256:abc123"]
supersedes: null
```

Multiple entries can be created during a session. They are buffered locally.

### After reasoning: COMMIT

At session end, the agent submits its entries:

```
write(entry) → ContextEntry | ConflictError
```

For each entry:
1. Submit to the scope's log
2. If accepted, the entry is now part of the active set
3. If rejected with a conflict, the agent receives the conflicting entry's id and message
4. The agent can either withdraw (abandon the entry) or resolve (submit a new entry with `supersedes`)

### Filtered reads

```
read(scope: "project.contextly", kind: "rule")       → rules only
read(scope: "project.contextly", cid: "auth.*")       → entries with cid starting with "auth"
read(scope: "project.contextly", cid: "auth.provider") → single entry
```

---

## 8. API Primitives

Five operations. Every other capability is derived from these.

```
read(scope, [kind], [cid])      → ContextEntry[] | ContextEntry
  Returns the active set for a scope. Optional filter by kind or cid.
  Without filters, returns all active entries for the scope.
  With cid, returns the single active entry for that cid (or a conflict).

write(entry)                    → ContextEntry | ConflictError
  Submits a context entry. `id` and `timestamp` are assigned by the protocol.
  Returns the completed entry on success, or a ConflictError with the
  conflicting entry's id and message.

fork(scope, parentScope)        → Scope
  Creates a new scope that inherits the active set of parentScope.
  No entries are copied — the fork maintains a reference to the parent.

merge(source, target)           → MergeResult
  { adopted: Entry[], conflicts: Conflict[], rejected: Entry[] }
  Incorporates entries from source scope into target scope.
  Conflicts must be resolved before the merge completes.

resolve(scope, cid, supersedingId) → ContextEntry
  Resolves a conflict by submitting an entry that supersedes one of the
  conflicting entries. The superseding entry must be written first via
  write(), then referenced here. Shortcut for write() with supersedes set.
```

Five primitives. Everything else — history, search, diff, export, audit — is a composition of these.

---

## Appendix A: Wire Format

```json
{
  "id": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "cid": "auth.provider",
  "message": "Authentication uses Supabase RLS with JWTs.",
  "kind": "decision",
  "scope": "project.contextly",
  "author": "agent:claude",
  "timestamp": "2026-07-27T10:00:00Z",
  "parents": ["sha256:abc123..."],
  "supersedes": null,
  "status": "active"
}
```

Acceptable for submission (without id and timestamp — protocol fills them):

```json
{
  "cid": "auth.provider",
  "message": "Authentication uses Supabase RLS with JWTs.",
  "kind": "decision",
  "scope": "project.contextly",
  "author": "agent:claude",
  "parents": ["sha256:abc123..."],
  "supersedes": null
}
```

---

## Appendix B: Storage Format

The local log is JSON Lines — one entry per line, appended to a file:

```
{"id":"sha256:abc","cid":"auth.provider","message":"...","kind":"decision","scope":"project.contextly","author":"agent:claude","timestamp":"2026-07-27T10:00:00Z","parents":[],"supersedes":null,"status":"active"}
{"id":"sha256:def","cid":"db.orm","message":"...","kind":"rule","scope":"project.contextly","author":"human:alice","timestamp":"2026-07-27T11:00:00Z","parents":["sha256:abc"],"supersedes":null,"status":"active"}
```

---

## Appendix C: Scopes and Cids Cheat Sheet

| Concept | Format | Example |
|---------|--------|---------|
| Scope | dotted-path, top-down | `org.acme.team-payments` |
| cid | dotted-path, flat per scope | `auth.provider` |
| author | `type:name` | `agent:claude`, `human:alice` |
| id | `sha256:hex` | `sha256:e3b0c44...` |
| kind | lowercase string | `decision`, `rule`, `observation` |
| status | lowercase string | `active`, `superseded`, `archived`, `tombstoned` |

---

**Context is memory. Memory is text. Text is shared.**

This is the entire protocol. Everything else is implementation.