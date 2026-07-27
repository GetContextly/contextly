# The 10-Year Vision: 100 Million Developers

At this scale:
- The global Claim graph contains tens of billions of Claims
- Millions of workspaces
- Thousands of organizations with full constraint hierarchies

## What Breaks

- A single centralized Postgres instance is impossible
- Real-time constraint propagation across orgs requires a distributed protocol
- Storage costs for the full DAG become significant

## The Architecture That Survives

- **Local-first**: Every workspace has a complete local copy of its Claim DAG. Sync is log-based (CRDT appendix). The cloud is a relay, not a source of truth.
- **Eventual consistency with deterministic resolution**: Claim DAG merges are commutative. Two agents in different locations can make Claims independently and merge without conflict, because content-addressed hashing prevents identity collisions.
- **Federated namespaces**: Each organization has a namespace. Cross-org Claim references are explicit (like DNS). Org A can reference a Claim from Org B's namespace only if Org B publishes it.
- **Edge-based constraint computation**: The active constraint set for a workspace is computed at the CDN edge, not in a central database. The computation is a graph traversal — trivially parallelizable, cacheable, composable.