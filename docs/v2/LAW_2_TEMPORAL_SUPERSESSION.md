# Law 2: Law of Temporal Supersession

**A Claim with a later timestamp replaces a Claim with an earlier timestamp if and only if they share the same proposition and scope, and the later Claim explicitly sets `supersedes` to the earlier Claim's hash.**

Supersession is explicit, not implicit. Time alone does not invalidate a Claim. If a new Claim contradicts an old one but does not explicitly supersede it, both are active and the system must flag a conflict.

*Rationale:* Implicit supersession by time is dangerous — a junior agent's later claim could silently override a senior architect's earlier decision. Explicit supersession preserves intent.