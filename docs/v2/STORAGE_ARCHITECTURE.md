# The Storage Architecture

### Append-Only Log

The Claim DAG is stored as an append-only log of Claim records. Each record is a Claim. Records are never modified after creation. Supersession is represented by a new Claim that references the old one.

### Content Addressing

Each Claim is identified by `SHA256(proposition + scope + timestamp)`. This means:
- Identical Claims have the same hash (deduplication)
- Claims are immutable (any change changes the hash)
- References between Claims use hashes, not UUIDs (verifiable integrity)

### Local-First Sync

Each workspace has a complete local copy of its Claim DAG (SQLite or similar). Sync to the cloud is a log exchange:
- Push: append new Claims to the cloud log
- Pull: fetch Claims from the cloud log that are not in the local log

Because Claims are immutable and content-addressed, sync is commutative and idempotent. No locking, no coordination, no ordering constraints.

### Cloud as a Relay

The cloud stores the canonical log for each workspace. It does not store derived state (that is computed on the edge). It does not store embeddings (those are computed asynchronously). It does not store the active constraint set (that is computed on read).

The cloud's job is to:
- Accept new Claims
- Distribute Claims to connected clients
- Provide a sync endpoint for fetching missed Claims
- Store the authoritative log for disaster recovery

### Conflict Resolution Is Deterministic

Because Claims are immutable and references are explicit, conflict resolution is a local computation — no consensus protocol required. Given two divergent DAGs, any node can compute the merged DAG by applying the Laws of Context deterministically. The result is the same regardless of where the computation runs.

This is the CRDT insight applied to constraint graphs.