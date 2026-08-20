# Spec Ambiguities and Interpretations

**Filed during implementation of the Commitment DAG storage layer — July 2026**

---

## Ambiguity 1: Lifecycle States — Prompt vs. Protocol

**Prompt says**: `created, validated, approved, activated, superseded, conflicted, merged, deleted, archived`

**Protocol says (Section 3 — Commitment Model)**: The lifecycle is:

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

Valid statuses: `"active" | "superseded" | "archived" | "tombstoned"`

The prompt lists nine states. The protocol defines four entry statuses plus one pre-submission state (draft, which lives in the agent's buffer, not in the store).

**Interpretation chosen**: I implement the protocol exactly. The storage layer has four statuses:
- `active` — entry is live and constrains the workspace
- `superseded` — entry has been replaced by a newer entry
- `archived` — entry is old and excluded from default queries
- `tombstoned` — message redacted, graph structure preserved

The prompt's "validated", "approved", "conflicted", "merged", and "deleted" do not exist as entry statuses in the protocol:
- Validation is a check that happens at submit time, not a status
- Approval does not exist — the protocol is trustless at the validation layer
- Conflict is a property of a (scope, cid) pair, not a status of an individual entry
- Merge is an operation, not a status — merged entries become active in the target scope
- Delete does not exist — entries are tombstoned instead

---

## Ambiguity 2: Immutability vs. Status Mutation

**Protocol says (Appendix B — Storage Format)**: "Records are never modified after creation."

**Protocol also says (Section 3 — Supersede)**: "The protocol marks the target as `status: 'superseded'`."

These are contradictory. Marking a target as superseded requires an UPDATE, which violates "never modified after creation."

**Interpretation chosen**: Content (id, cid, message) is immutable — never changes after creation. The id proves content integrity. Status is mutable lifecycle metadata — it changes as entries transition through the lifecycle (active → superseded/archived/tombstoned). This preserves the content-addressed integrity guarantee while allowing the lifecycle the protocol requires.

Implementation: the `status` column is updated in place. All other columns are immutable after insert. A trigger or application check prevents status from transitioning backward (e.g., superseded → active).

---

## Ambiguity 3: Cycle Detection Feasibility

**Prompt requires**: "Detect and reject cycles at write time."

**Protocol analysis**: Cycles in the supersession chain are structurally impossible in an append-only DAG where:
1. Entries are immutable — you cannot change an existing entry's `supersedes` field
2. New entries supersede older entries (forward reference)
3. The new entry does not exist yet when the supersedes reference is checked

Given A exists, and B is created with `supersedes = A.id`: tracing from A through the supersession chain can never reach B because B doesn't exist yet. The only way to create a cycle (A → B → C → A) would require modifying A after B and C exist, which immutability prevents.

**Interpretation chosen**: I implement cycle detection for defense-in-depth. The check traces the supersession chain from the target entry through all ancestors. If any ancestor's id matches the new entry's computed id (which shouldn't happen since it's not yet inserted), the write is rejected. This is a safety net for bugs, not a case the protocol can produce in normal operation.

---

## Ambiguity 4: Event Log Separate Table?

**Prompt requires**: "Append-only event log for state transitions."

**Protocol analysis**: The entries table IS the event log. Each entry records a state transition:
- A new entry with `status: "active"` is a "created" event
- An entry with `supersedes` set is a "superseded" event for the referenced target
- An entry with `status: "archived"` is an "archived" event

The protocol does not define a separate event log table.

**Interpretation chosen**: The `entries` table is the sole event log. State transitions are recorded by:
- Creating a new entry (active → becomes part of active set)
- Updating an existing entry's status to superseded/archived/tombstoned (forward lifecycle transition)

No separate event table. The appended log of entries PLUS the status update history IS the complete event record.

---

## Summary of Exact Protocol Compliance

| Dimension | Implemented As | Source |
|-----------|---------------|--------|
| Identity | `SHA256(cid + "." + message)` → `sha256:hex` | PROTOCOL §1 |
| Primary Key | `id TEXT` (content hash) | PROTOCOL §2 |
| Status values | `active`, `superseded`, `archived`, `tombstoned` | PROTOCOL §2 |
| Kind values | `decision`, `rule`, `observation` | PROTOCOL §2 |
| Timestamp | ISO 8601, assigned by protocol on accept | PROTOCOL §3 |
| supersedes | References `id` of target; target marked superseded | PROTOCOL §3 |
| parents | Not validated; stored as JSON array | PROTOCOL §3, ARCHITECTURE §1 |
| Conflict detection | Same scope + same cid + different message + no supersedes | PROTOCOL §5 |
| Storage engine | SQLite | ARCHITECTURE §1 |
| Indexes | `idx_active`, `idx_scope_active`, `idx_supersedes`, `idx_history` | ARCHITECTURE §1 |
| id format | `sha256:hex` | PROTOCOL Appendix C |