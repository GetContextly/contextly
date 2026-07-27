# The Retrieval Architecture

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