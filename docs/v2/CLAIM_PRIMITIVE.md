# The Fundamental Primitive: Claim

After challenging the "Commitment" primitive first proposed, we arrive at a more fundamental unit: the **Claim**.

A Claim is the atomic unit of context. It asserts a proposition about some part of a system, within a boundary, at a point in time, with a measurable degree of certainty.

```typescript
interface Claim {
  id: Hash;                     // content-addressed: SHA256(proposition + scope + timestamp)
  proposition: Proposition;     // (entity, attribute, value) — the assertion
  scope: Scope;                 // boundary within which this Claim is valid
  certainty: number;            // 0.0–1.0 — how confident we are in the truth of this Claim
  timestamp: Timestamp;         // when the Claim was asserted
  provenance: Provenance;       // how the Claim was generated
  parents: Hash[];              // zero or more Claims this depends on
  supersededBy: Hash | null;    // if this Claim has been replaced
  status: ClaimStatus;          // active | superseded | expired | rejected
}

type Proposition = {
  entity: string;               // the subject (e.g., "auth.service", "project:contextly")
  attribute: string;             // the property (e.g., "provider", "architecture")
  value: unknown;               // the asserted value (e.g., "Supabase RLS", "microservices")
};

type Provenance = 
  | { kind: "decision"; author: Agent | Human }
  | { kind: "observation"; source: "test" | "monitor" | "scan" }
  | { kind: "inference"; from: Hash[]; rule: string }
  | { kind: "report"; author: Agent | Human; original: ExternalReference }
  | { kind: "derived"; from: Hash[]; transform: string };

type ClaimStatus = "active" | "superseded" | "expired" | "rejected";
```

### Why Claim, Not Commitment

Commitment implies agency — a conscious decision to adopt a constraint. But much of the context that shapes future decisions is not a decision at all. It is:

- An **observation**: "the test suite passes" — this constrains the validity of any refactoring that changes behavior
- An **inference**: "the API response format changed from XML to JSON between v1 and v2" — this constrains API client code
- A **derived fact**: "the average response time is 240ms" — this constrains performance budgets
- A **status**: "the deployment is in rollback" — this constrains what changes can be merged

These are not decisions. They are not commitments. But they are active constraints on the decision space. A system that only models commitments misses half of the context that actually matters.

Claim encompasses all of these. A decision is a Claim with `provenance.kind = "decision"` and additional lifecycle fields. An observation is a Claim with `provenance.kind = "observation"`. An inferential fact is a Claim with `provenance.kind = "inference"`. Every piece of context that constrains future action is a Claim.

### Claim Properties

| Property | Definition |
|----------|-----------|
| **Atomic** | A Claim cannot be subdivided. It asserts exactly one proposition. |
| **Addressable** | A Claim is identified by its content hash. Same proposition + same scope + same timestamp = same hash. |
| **Immutable** | A Claim never changes after creation. It can only be superseded. |
| **Temporal** | A Claim has a timestamp. It is anchored in time. |
| **Scoped** | A Claim is valid within a specific boundary. It does not apply everywhere. |
| **Certain** | A Claim carries a certainty score. Not all context is equally reliable. |
| **Provable** | A Claim references its provenance. It can be audited. |
| **Composable** | A Claim can reference parents. The graph emerges from these references. |

### The Graph Emerges Naturally

Claims reference other Claims through `parents`. This creates a DAG:

```
Claim A: (auth.service, provider, Supabase RLS)
  └─ parent: Claim B: (project:contextly, database, Supabase)
       └─ parent: Claim C: (project:contextly, requirements, row-level-security)
```

The graph is not artificial. It reflects the dependency structure of real decisions. You chose Supabase RLS because you chose Supabase. You chose Supabase because you needed RLS. The graph of Claims is the architecture, made explicit.