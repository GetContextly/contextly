# Contextly: The Constraint DAG

## A Design Paper for the Infrastructure of AI Context

**Version 1.0 — July 2026**

---

## Abstract

This document describes a new category of infrastructure: the **Constraint DAG**. Unlike existing systems that store context as retrievable documents or vector embeddings, Contextly models context as a directed acyclic graph of *Claims* — atomic, scoped, timestamped assertions about the state of a system. Each Claim either constrains future decisions or records a constraint that was already applied. The system acts not as a database that agents query, but as a **compiler** that agents inherit — actively enforcing the constraint space at session start and continuously validating every proposal against the established graph. This paper defines the atomic primitive (the Claim), the eleven immutable laws of context propagation, the fork/commit/merge interface for agent collaboration, and the 10-year scalability path from single-user workspaces to a global constraint fabric serving billions of autonomous agents.

---

## 1. The Thesis

### The Category We Are Creating

Contextly is a **constraint infrastructure layer** for AI — not a memory system, not a vector database, not a document store. It sits between AI agents and the systems they act upon, enforcing the accumulated decisions, observations, and rules that define how a project works.

This is a new category because:

- **Memory systems** (Mem0, Zep, OpenAI Memory) store what happened. They are retrospective. They answer "what was said?"
- **Vector databases** (Pinecone, Weaviate) store representations of content. They are similarity engines. They answer "what is similar?"
- **Document stores** (Notion, Confluence) store human-authored knowledge. They are static. They answer "what was written?"

Contextly does none of these. It answers: **"what constraints apply to this next decision?"**

This is inherently prospective. It is about narrowing the space of valid future actions, not enlarging the pool of retrievable past information.

### The Problem We Are Solving

AI agents today operate in a vacuum. Every session begins with zero knowledge of prior decisions, architectural constraints, or organizational policies. This is not a storage problem — it is a **continuity of constraint propagation** problem.

An agent working on authentication has no way of knowing that the team standardized on Supabase RLS three months ago, unless that information is explicitly injected into the context window. And even when it is, the agent has no way of committing its own decisions back into a shared constraint space that the next agent will inherit.

The result is a cycle of:
- Repeated mistakes
- Silent contradictions between agents
- Lost rationale for architectural choices
- Context window exhaustion from redundant background information

Current "solutions" — system prompts, knowledge bases, RAG pipelines — are patches on a missing substrate. They treat the symptom (agents lack information) rather than the cause (agents lack a constraint propagation layer).

### Why Existing AI Memory Systems Fail

Every existing AI memory system makes the same mistake: they model context as **content** — documents, vectors, conversation logs — and treat retrieval as **search**. This fails because:

1. **Content is infinite; constraints are finite.** A project generates unlimited content (commits, conversations, PR comments). But the number of active constraints on the decision space is bounded and small. The constraint set for a mature project fits in a few hundred structured records. The content history fills gigabytes. Storing content when the value is in constraints is an optimization error.

2. **Search is probabilistic; constraint inheritance is deterministic.** A vector search for "authentication decisions" may or may not return the relevant row. A constraint query ("what active Claims apply to scope=auth?") returns exactly the five constraints that govern authentication. One is unreliable; the other is an invariant.

3. **Memory is retrospective; constraints are prospective.** Storing past conversations helps an agent understand what was discussed. It does not help an agent understand what it is *allowed* to do. The difference is between a transcript and a constitution.

4. **Similarity is not relevance.** A vector search returns what is textually similar, not what is contextually relevant. A decision about "Supabase" is relevant to authentication even if the text says "we chose Supabase for real-time subscriptions" — a vector search for "authentication" with low similarity threshold would miss it. A constraint query over the entity graph finds it because "Supabase" is linked to "authentication" via a prior Claim.

5. **Memory systems optimize for recall; context systems optimize for correctness.** The goal of a memory system is to retrieve as much relevant information as possible. The goal of a Contextly is to return exactly the set of active constraints — no more, no less. Extra context is noise. Missing context is a bug.

### Why This Deserves to Exist

AI agents are becoming the primary interface through which software is built, operated, and maintained. Each agent, each session, each tool is currently isolated. There is no shared substrate that decisions propagate through.

This substrate will be built. The question is whether it is built as an afterthought inside every agent platform (fragmented, inconsistent, proprietary) or as an open infrastructure layer that every agent speaks (unified, composable, persistent).

Contextly exists to be that substrate. It is the Git of the AI age — not a tool, but a protocol and a storage layer that decisions flow through.

---

## 2. The Fundamental Primitive

### Claim

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

---

## 3. The Eleven Laws of Context

These are the immutable rules of constraint propagation. They cannot change without breaking the system. Everything else in the design is derived from these laws.

### Law 1: Law of Atomic Scope

**A Claim is valid within exactly one scope, and within that scope it constrains all propositions that share its entity.**

A Claim about `(auth.service, provider, Supabase RLS)` with `scope = workspace:main/auth` constrains any future Claim about `(auth.service, provider, ...)` within the `workspace:main/auth` scope. It does not constrain anything outside that scope. It does not constrain Claims about `(auth.service, database, ...)` — those are separate propositions.

*Rationale:* Without atomic scope, Claims become ambient — they apply everywhere, making the system impossible to reason about.

### Law 2: Law of Temporal Supersession

**A Claim with a later timestamp replaces a Claim with an earlier timestamp if and only if they share the same proposition and scope, and the later Claim explicitly sets `supersedes` to the earlier Claim's hash.**

Supersession is explicit, not implicit. Time alone does not invalidate a Claim. If a new Claim contradicts an old one but does not explicitly supersede it, both are active and the system must flag a conflict.

*Rationale:* Implicit supersession by time is dangerous — a junior agent's later claim could silently override a senior architect's earlier decision. Explicit supersession preserves intent.

### Law 3: Law of Certainty Composition

**A derived Claim inherits the minimum certainty of its parents, modified by the reliability of the derivation rule.**

```
certainty(Claim_C) = min(certainty(Claim_A), certainty(Claim_B)) * reliability(derivation_rule)
```

If Claim A has certainty 0.95 and Claim B has certainty 0.70, and the inference rule is 90% reliable, the derived Claim has certainty 0.70 * 0.90 = 0.63.

*Rationale:* Certainty should decrease, not increase, along derivation chains. If a fact is uncertain, anything built on it is at most as certain.

### Law 4: Law of Half-Life

**Every Claim has a half-life parameter. After one half-life from its timestamp, its certainty decays by half. After five half-lives, it enters `expired` status.**

Half-life is set based on provenance:
- `decision` by human: half-life = 1 year
- `decision` by agent: half-life = 90 days
- `observation`: half-life = 30 days (or tied to the observation frequency)
- `derived`: half-life = minimum of parents' half-lives

*Rationale:* Context decays. A database decision from 2023 is less reliable than one from 2026. The half-life mechanism ensures the system automatically deprioritizes stale context rather than requiring manual review.

### Law 5: Law of Conflict

**Two active Claims within the same scope that assert different values for the same (entity, attribute) constitute a conflict. A conflict must be resolved before either Claim can be used as the sole basis for a derived Claim.**

Conflict resolution:
1. If one Claim has `supersededBy` set, the superseding Claim wins.
2. If neither has been superseded, the Claim with higher certainty wins.
3. If certainty is equal, the Claim with higher-authority provenance wins (human > agent, observation > inference).
4. If still tied, the conflict is flagged for human resolution.

*Rationale:* Silent contradictions destroy trust. Conflicts are not errors — they are evidence of active exploration or disagreement. The system surfaces them rather than hiding them.

### Law 6: Law of Inheritance

**Agents and humans entering a workspace automatically inherit the intersection of all active Claims within that workspace's scope.**

This is not query-based. It is automatic. The constraint set is computed at session start and injected into the agent's context. The agent does not ask "what constraints apply?" — it receives them.

*Rationale:* If an agent must ask for constraints, it will forget to ask. The system must push constraints, not wait for pull.

### Law 7: Law of Propagation

**When a new Claim is created, the system checks all active Claims in the same scope for conflicts. If none exist, the Claim is accepted. If a conflict exists, the system applies the Law of Conflict.**

Propagation is automatic and immediate. The constraint set is updated in real time as new Claims are asserted.

*Rationale:* A decision affects every subsequent decision. The delay between "committing to a choice" and "enforcing that choice" should be zero.

### Law 8: Law of Reversibility

**A superseded Claim is never deleted. It remains in the graph with status `superseded`. The system can reconstruct the full history of a constraint by tracing its supersession chain.**

This is the Git model. No information is lost. The active constraint set is the frontier of the DAG — the superseded Claims are the history.

*Rationale:* The decision history is as important as the current constraints. Understanding why a constraint was replaced is essential for future reasoning.

### Law 9: Law of Workspace Isolation

**Claims in one workspace do not affect another workspace unless explicitly linked via a cross-workspace reference.**

Cross-workspace references are Claims whose scope includes a workspace prefix (e.g., `workspace:org/policy:auth`). They are inherited by child workspaces unless overridden.

*Rationale:* Without isolation, an experiment in one workspace would corrupt the constraint set of another. Workspace isolation is the fundamental mechanism for parallel exploration.

### Law 10: Law of Compression

**A set of related Claims can be compressed into a single summary Claim if and only if doing so does not lose information required by the current active constraint set.**

Compression is lossless with respect to active constraints. It may lose historical detail (which is available in the full DAG via the Law of Reversibility). The compression threshold depends on workspace size and age.

*Rationale:* Over time, the DAG grows. Historical Claims about trivial implementation details are noise. Compression collapses them into summary Claims, preserving the constraint set while reducing graph size.

### Law 11: Law of Non-Contradiction

**An agent cannot make a proposal that contradicts an active Claim unless the proposal explicitly includes a supersession directive.**

This is the constraint compiler in action. Before an agent proposes any change, the change is checked against the active Claim set. If a violation is detected, the system returns the violating Claim and blocks the proposal.

*Rationale:* This is the line between a constraint observer and a constraint enforcer. Contextly enforces. An agent cannot "forget" to check — the system checks automatically.

---

## 4. The Mental Model

### One Sentence

Contextly is a versioned constraint graph that agents inherit at session start and contribute to as they work — like Git for the rules of your project.

### One Paragraph

Every AI agent session begins with zero knowledge of the decisions, policies, and observations that constrain the project. Contextly solves this by modeling context as a directed acyclic graph of Claims — atomic propositions about the state of the system, each scoped to a workspace, timestamped, and weighted by certainty. When an agent enters a workspace, it inherits the complete active Claim set — the constraints it must work within. As the agent makes decisions, they become new Claims added to the graph. The graph persists across sessions, across tools, across developers. It grows more accurate over time because old Claims decay and new Claims reinforce or supersede old ones. The system acts as a compiler for agent decisions, validating every proposal against the constraint graph before it can be executed.

### One Page

**What we build:** The Constraint DAG — a distributed, content-addressed, append-only graph of Claims that serves as the shared memory of decisions for AI agents and the humans who supervise them.

**Who uses it:** Every AI agent that writes code, reviews code, designs systems, or operates infrastructure. Every developer who wants their tools to share a coherent understanding of what their project is and how it works.

**How it works:**

1. A workspace is created for a project, a team, an organization, or even a single session. The workspace has a scope — the boundary within which its Claims are valid.

2. The first Claim might be seeded from a README, a conversation with an engineer, or an automated analysis of the git history. "The project uses Supabase for auth." "The database schema has 12 tables." "The team prefers TypeScript." Each is a Claim: a proposition, scoped, timestamped, with provenance.

3. When an agent connects to a workspace, it inherits the active Claim set — the intersection of all Claims relevant to its scope. This is not a query the agent makes. It is a projection the system computes.

4. As the agent works, it creates new Claims. "We decided to use RLS policies on the users table." This becomes a Claim with `provenance = { kind: "decision" }`. It references the parent Claim about Supabase. It is added to the graph.

5. When a second agent connects to the same workspace, it inherits both the original Supabase Claim and the new RLS Claim. It knows, without being told, that authentication uses RLS policies on the users table.

6. If a third agent proposes a change that contradicts a Claim — "let's switch to Firebase Auth" — the constraint compiler intercepts the proposal and returns the conflicting Claim as evidence. The agent must either abandon the proposal or explicitly supersede the old Claim.

7. Over time, Claims decay. An old Claim about "using sessions for auth" has expired because it was superseded by "using JWT." The active constraint set is always the frontier of the DAG — the most recent, non-superseded Claims.

8. Workspaces fork and merge. An experimental feature branch creates a fork of the main workspace. Claims made in the fork do not affect the main workspace until the fork is merged. On merge, the fork's Claims are integrated into the main graph, and the conflict resolution engine ensures consistency.

**The interface:**

- `fork(workspace, scope?)` — create a new workspace that inherits all parent Claims
- `claim(proposition, scope, provenance, supersedes?)` — add a Claim to the graph
- `merge(source, target)` — integrate Claims from one workspace into another, resolving conflicts
- `constraints(scope)` — return the active Claim set for a scope (traversal, not search)
- `history(entity)` — return the full DAG of Claims about an entity (audit trail)

Three write operations. Two read operations. Everything is built from these.

---

## 5. What Contextly Is NOT

### A Memory Database

A memory database stores conversation history, user preferences, and session state. It is scoped to a single user or a single conversation. It does not model constraints. It does not enforce them. It does not compose across users or sessions.

Contextly does none of this. It does not store conversation history. It does not model user preferences. It is not scoped to a single conversation. What it does — propagate constraints across sessions, tools, and users — a memory database cannot do.

### A Vector Database

A vector database stores embeddings and retrieves by similarity. It is a search engine for representations. It does not understand scope, does not track provenance, does not enforce constraints, does not model certainty.

Contextly is not a better vector database. It is a different category. The vector index is a derived optimization for fuzzy retrieval, not the primary storage model. The primary model is the DAG.

### A RAG System

RAG (Retrieval-Augmented Generation) retrieves documents and injects them into an LLM's context window. It is a bandwidth optimization for context windows. It does not model constraints. It does not track supersession. It does not enforce anything.

Contextly is not a RAG system. RAG retrieves documents; Contextly propagates constraints. RAG is passive (retrieve on query); Contextly is active (inject on session start, block on violation). RAG answers "what is relevant?"; Contextly answers "what applies?"

### A Document Store

Document stores hold human-authored content — specifications, design docs, runbooks. They are static. They require humans to write, update, and deprecate content. They do not automatically propagate or enforce anything.

Contextly is not a document store. Claims are created by agents as they work, not by humans writing docs. Claims are automatically superseded. Claims are checked for consistency automatically. A document store is a library; Contextly is a compiler.

### An Agent Memory

Agent memory systems (Mem0, Zep) store per-user, per-agent conversational context. They are scoped to a single agent-user relationship. They do not compose across agents. They do not model project-level constraints.

Contextly is not an agent memory system. It is not per-agent. It is per-workspace, which may contain many agents. It is not conversational. It is constraint-oriented. Agent memory is "what did we talk about?" Contextly is "what did we decide?"

### A Configuration Management System

Configuration management stores environment variables, feature flags, and deployment configs. It is machine-oriented, not decision-oriented. A config change is a deployment event, not a constraint.

Contextly is not configuration management. A Claim about "the database URL is `postgres://...`" looks like a config entry but functions differently: it is a constraint on all database-dependent decisions, traceable to its provenance, with a certainty that decays over time, linked to parent Claims about the infrastructure decision.

---

## 6. The 10-Year Vision

### 100 Million Developers

At this scale:
- The global Claim graph contains tens of billions of Claims
- Millions of workspaces
- Thousands of organizations with full constraint hierarchies

**What breaks:**

- A single centralized Postgres instance is impossible
- Real-time constraint propagation across orgs requires a distributed protocol
- Storage costs for the full DAG become significant

**The architecture that survives:**

- **Local-first**: Every workspace has a complete local copy of its Claim DAG. Sync is log-based (CRDT appendix). The cloud is a relay, not a source of truth.
- **Eventual consistency with deterministic resolution**: Claim DAG merges are commutative. Two agents in different locations can make Claims independently and merge without conflict, because content-addressed hashing prevents identity collisions.
- **Federated namespaces**: Each organization has a namespace. Cross-org Claim references are explicit (like DNS). Org A can reference a Claim from Org B's namespace only if Org B publishes it.
- **Edge-based constraint computation**: The active constraint set for a workspace is computed at the CDN edge, not in a central database. The computation is a graph traversal — trivially parallelizable, cacheable, composable.

### Billions of Agents

At this scale:
- Most Claims are generated by agents, not humans
- Agents work in parallel across millions of active sessions
- The Claim ingestion velocity exceeds the human review velocity by 10,000:1

**What breaks:**

- Human-in-the-loop conflict resolution becomes impossible at agent velocity
- The half-life model must account for agent-generated Claims being less reliable than human-generated ones
- Claim quality becomes a system-wide concern

**The architecture that survives:**

- **Automated conflict resolution**: The conflict resolution engine escalates only when certainty-weighted automatic resolution fails (both Claims have equal certainty and equal authority). This happens rarely — most conflicts are resolved by confidence asymmetry.
- **Reputation-based authority**: Agent authors accumulate reputation over time based on the survival rate of their Claims. An agent whose Claims are consistently superseded has low reputation. An agent whose Claims persist has high reputation. This creates a natural quality filter.
- **Batched claim ingestion**: Agents do not create Claims one at a time. They create batches (session-scoped), which are validated as a set against the constraint graph before acceptance.

### Autonomous Companies

At this scale:
- Entire software organizations run through autonomous agent workflows
- The Claim graph IS the organization's knowledge, in executable form
- Decision velocity is measured in Claims per second, not decisions per sprint

**What breaks:**

- The workspace hierarchy must mirror the org structure exactly, or governance fails
- Cross-team Claim conflicts must be resolved without human escalation
- Audit and compliance require full replay of the Claim DAG

**The architecture that survives:**

- **Hierarchical workspace namespaces**: `org:acme/team:payments/project:checkout/sprint:23` — each level inherits Claims from the parent, can override, and is isolated from siblings.
- **Governance policies as Claims**: A Claim can assert that "all Claims about `security` in the `payments` workspace must have `certainty >= 0.9` and `provenance.kind = decision`". Governance is self-referential — the constraint graph constrains itself.
- **Full audit replay**: Because Claims are immutable and timestamped, the state of the constraint graph at any point in time can be reconstructed by replaying the DAG up to that timestamp. This is the equivalent of `git checkout <hash>` for decisions.

### Continuous AI Workers

At this scale:
- Agents run continuously, not per-session
- A single agent may live for years, accumulating a personal Claim DAG that spans projects, organizations, and roles
- The global Claim graph is an evolving artifact that never stops changing

**What breaks:**

- Static workspaces (one per project) are insufficient — agents need persistent personal workspaces
- Claim decay must work differently for personal vs organizational Claims
- The constraint compiler must operate in streaming mode, not batch mode

**The architecture that survives:**

- **Personal workspaces**: Every agent has a personal workspace that persists across sessions, projects, and organizations. This workspace contains the agent's history of Claims, filtered through the scopes of the projects it has worked on. When the agent returns to a project, its personal Claims are reconciled with the project's active Claim set.
- **Streaming constraint propagation**: The constraint set is not computed once at session start. It is a streaming computation that updates as new Claims are created, Claims decay, and conflicts are resolved. Agents subscribe to constraint change events and react accordingly.
- **Ephemeral workspaces for tasks**: A short-lived task (review a PR, analyze a bug) creates an ephemeral workspace that inherits from the parent workspace and is discarded after the task completes. The Claims made during the task are merged back to the parent if accepted.

---

## 7. The Storage Architecture

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

---

## 8. The Retrieval Architecture

### Two Modes

**Mode 1: Constraint Query (Deterministic)**

Given a scope, return the active Claim set. This is a DAG traversal: start at the root Claims for the scope, follow the supersession chain to the frontier, filter by status=active, filter by certainty > threshold, sort by relevance (certainty × freshness).

This operation is deterministic. Given the same DAG and the same scope, it always returns the same result. It does not depend on embedding quality, model temperature, or query phrasing.

Agent usage: "What are the active constraints for authentication in this project?" Returns exactly the 3–15 Claims that govern auth.

**Mode 2: Discovery Search (Similarity-Based)**

Given a natural language query, return Claims that are semantically related. This uses a vector index generated asynchronously from the Claim DAG. Results are ranked by similarity × certainty × freshness.

This operation is fuzzy. It depends on embedding quality. It returns candidates, not authoritative constraints.

Agent usage: "Find anything related to the payment API changes we discussed last month." Returns a ranked list of historical Claims.

### The Constraint Compiler

The constraint compiler is the most important retrieval mechanism. It operates differently from both modes above.

When an agent makes a proposal — any proposal — the compiler intercepts it and checks it against the active Claim set:

1. Propose: Agent suggests "use Firebase Auth for the mobile client."
2. Compile: System extracts entities from the proposal: `{entity: "auth.service", attribute: "provider"}`.
3. Check: System queries the active Claim set for `(auth.service, provider, *)` within the workspace scope.
4. Conflict: Existing Claim asserts `(auth.service, provider, "Supabase RLS")` with certainty 0.95.
5. Block: Compiler returns the conflicting Claim with a conflict explanation.
6. Resolution: Agent either abandons the proposal or creates a new Claim that explicitly supersedes the old one.

The compiler operates as a middleware layer between the agent and the system it acts upon. It does not add latency to normal operations — only to proposals that touch constrained entities.

---

## 9. The Interface

### For Agents (MCP Tools)

```
fork(workspaceId, scope?, parentWorkspaceId?) → workspace
  Creates a new workspace. Optionally scoped to a subset of the parent workspace.
  Inherits all active Claims from the parent.

claim(workspaceId, proposition, provenance, supersedes?) → Claim
  Adds a Claim to the workspace. Checks for conflicts. Returns the created Claim or a conflict error.

merge(sourceWorkspaceId, targetWorkspaceId) → MergeResult
  Merges Claims from source into target. Applies conflict resolution.
  Returns { accepted: Claim[], conflicts: Conflict[], rejected: Claim[] }.

constraints(workspaceId, scope?) → ConstraintSet
  Returns the active Claim set for the given scope within the workspace.
  Result is deterministic: same DAG, same scope, same result.

constrain(workspaceId, proposal: Proposition) → ConstraintCheck
  Checks a proposal against the active Claim set without creating a Claim.
  Returns { allowed: boolean, conflicts: Conflict[], supporting: Claim[] }.

history(workspaceId, entity) → Claim[]
  Returns the full DAG (including superseded and expired Claims) for an entity.
```

### For Humans (Dashboard)

The dashboard is not a CRUD interface. It is an observability tool:

- **Constraint graph view**: Visualize the DAG of Claims for a workspace. See how decisions are connected. Trace the supersession chain.
- **Conflict dashboard**: See active conflicts that need resolution. Filter by workspace, scope, severity.
- **Activity timeline**: See Claims created over time. Filter by agent, human, provenance.
- **Workspace health**: Claim count, active conflict count, average certainty, oldest active Claim.

---

## 10. The Security Model

### Capability-Based, Not Identity-Based

Access is granted by workspace membership, not by user identity. A workspace membership carries capabilities: `claim`, `merge`, `constrain`, `read`. These capabilities are inherited from parent workspaces.

### Claim-Level Access

A Claim is readable by any member of its workspace. A Claim is writable only by the agent or human that created it (for lifecycle operations like superseding).

### Cross-Workspace References

A Claim in workspace A can reference a Claim in workspace B only if workspace B publishes the referenced Claim to workspace A. Publication is an explicit act (the `publish(workspace, ref)` operation).

### No Service Role

There is no service role key. Every component authenticates with workspace-scoped credentials. The MCP server presents a workspace credential, not a global admin key.

---

## Closing

The Constraint DAG is not a better memory system. It is not a faster vector database. It is not a smarter RAG pipeline. It is a new category of infrastructure — the substrate through which AI agents inherit, propagate, and enforce the accumulated decisions of every session that came before them.

The problem with current AI memory systems is not that they are poorly implemented. It is that they model the wrong thing: content, when they should model constraints; retrieval, when they should model inheritance; storage, when they should model propagation.

Contextly corrects this at the foundation.

*— July 2026*