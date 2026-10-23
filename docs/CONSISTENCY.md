# Sync Engine Consistency Guarantees

**What the Contextly Sync Engine guarantees — and what it does not.**

---

## Guarantees (These Hold)

### 1. No Data Loss

Every entry that is successfully inserted into a local Store is preserved. The append-only log is immutable — entries are never modified or deleted (status transitions are additive). Even if an entry is superseded, archived, or tombstoned, the original message is still present in the local log and the relay log.

### 2. Idempotent Push

Pushing the same entry to the relay multiple times produces exactly one copy on the relay. The relay deduplicates by content hash (`SHA256(scope + "." + cid + "." + message)`). This is guaranteed at the relay layer — the second push returns `status: "duplicate"`.

### 3. Deterministic Entry Identity

Every entry has a globally unique, content-addressed id. Two agents writing the same `(scope, cid, message)` produce the same id. This means:
- No UUID coordination needed between agents
- No central ID authority
- Idempotent merge — merging the same branch twice is safe

### 4. Strong Consistency Within a Single SQLite Store

On a single machine, all reads and writes to the Store go through SQLite with WAL mode and transactions. A write is immediately visible to all subsequent reads on the same Store instance. No stale reads within a single process.

### 5. Causal Ordering Within a Supersession Chain

If entry B supersedes entry A, then B is guaranteed to appear after A in the history for that cid. The Store enforces this at insert time: B cannot be inserted unless A already exists and is active. The relay enforces the same invariant.

### 6. Conflict Detection on Pull

When pulling entries from the relay, the SyncEngine runs the same conflict detection as the Store's insert path. If two entries exist for the same `(scope, cid)` with different messages and no supersession relationship, a `Conflict` is produced. Both entries remain active. The conflict is surfaced in the `SyncSummary.conflicts` array.

### 7. Compiler Cache Invalidation After Sync

After a pull completes, the SyncEngine calls `compiler.invalidateScope()`. Subsequent `compile()` calls will recompute the active set from the updated store. Stale compiled output is never served after a sync.

---

## Best-Effort (Not Guaranteed, but Handled Gracefully)

### 1. Clock Synchronization

The protocol assigns timestamps at the relay level (`timestamp` field), not at the client level. Local timestamps are set on offline writes but are overwritten by the relay's timestamp on push.

**What can go wrong**: During offline operation, local timestamps may drift. After sync, the relay's timestamp is canonical. If two agents write offline and both push later, the relay assigns new timestamps on acceptance. The local timestamp is preserved but the relay's timestamp is used for ordering.

**Impact**: If clock skew > a few seconds, the ordering of entries from different agents may not reflect real-world ordering. The protocol does not depend on clock ordering for correctness — supersession is explicit (via `supersedes`), not implicit (via timestamp).

### 2. Simultaneous Offline Writes to the Same (scope, cid)

Two agents can independently write to the same `(scope, cid)` while both are offline. When both come online and push:

1. Both entries are accepted by the relay (different content hashes → different ids)
2. Both agents pull and see the other's entry
3. The compiler detects the conflict and returns both entries as active

**No data is lost.** Both versions are preserved. The conflict must be resolved manually (or by a future agent writing a superseding entry).

### 3. Network Partitions

Under network partition:
- Each partition can continue to write and read locally (full offline capability)
- When the partition heals, push and pull operations transfer all missed entries
- Conflicts are detected during pull (see "Simultaneous Offline Writes" above)

**No split-brain scenario** exists because entries are append-only and content-addressed. There is no "last writer wins" scenario — both versions are always preserved. The only question is which version, if any, is treated as "active" for a given cid, and that is determined by explicit supersession, not by timing.

### 4. Partial Push Failure

If a push operation is interrupted mid-way (network failure, process crash):
- Some entries may have been accepted by the relay, others not
- On retry, already-accepted entries return `status: "duplicate"` (idempotent)
- Failed entries are retried
- No partial state is left on the relay

**Impact**: The local `pending_entries` table may show some entries as `synced` and others as `pending`. On retry, only pending entries are sent. The relay handles duplicates gracefully.

---

## Not Guaranteed

### 1. Global Total Ordering

There is no global clock. Entries from different scopes have no defined ordering relationship. Even within a scope, entries from different agents may have timestamps that don't reflect real-world ordering if clock skew exists. The only reliable ordering is:
- Within a supersession chain: B supersedes A → B after A
- Within a single Store: insertion order (SQLite rowid)

### 2. Cross-Region Strong Consistency

If the relay is replicated across regions (future feature), different regions may see entries at different times. The relay stores the canonical log in a single S3 prefix (or equivalent), so eventual consistency applies:

- A push to region A may not be visible to a pull from region B for some time (seconds to minutes)
- This is inherent in S3's read-after-write consistency model for the same prefix
- If cross-region strong consistency is required, the relay must use a strongly consistent store (e.g., DynamoDB global tables with DAX)

### 3. Real-Time Propagation

There is no push-based notification system in the current protocol. Agents poll for new entries via `pull()` or `sync()`. The interval between polls determines how quickly context propagates.

For real-time propagation, agents would need to either:
- Poll at a high frequency (trade-off: cost + latency)
- Use a WebSocket or Server-Sent Events connection to the relay (future feature)
- Use a local file watcher on the SQLite database (limited to same machine)

### 4. Merge Atomicity with Conflicts

The MergeEngine adopts non-conflicting entries even when conflicts exist in the same merge operation. This means:

- If source has 3 entries and 1 conflicts with target, the 2 non-conflicting entries are adopted
- The 1 conflicting entry is returned in `conflicts[]`, not adopted
- The merge "completes" with partial adoption

A true atomic merge (all-or-nothing) would require a two-phase protocol. The current design optimizes for adoption of non-conflicting entries rather than blocking on conflicts.

---

## Summary Table

| Property | Guaranteed? | Mechanism |
|----------|-------------|-----------|
| No data loss | ✅ | Append-only log, content-addressed |
| Idempotent push | ✅ | SHA256 content hash deduplication |
| Deterministic IDs | ✅ | `SHA256(scope + "." + cid + "." + message)` |
| Single-node strong consistency | ✅ | SQLite WAL + transactions |
| Conflict detection | ✅ | Compiler + SyncEngine detect at pull time |
| Cache invalidation after sync | ✅ | `compiler.invalidateScope()` |
| Clock-independent correctness | ✅ | Supersession is explicit, not timestamp-based |
| Global total ordering | ❌ | No global clock |
| Cross-region strong consistency | ❌ | S3 eventual consistency |
| Real-time propagation | ❌ | Poll-based; no push mechanism |
| Atomic merge with conflicts | ❌ | Partial adoption; conflicts returned separately |
| Offline write safety | ✅ | Content-addressed, no loss, conflicts detected