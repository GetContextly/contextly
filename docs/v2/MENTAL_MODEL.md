# The Mental Model

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