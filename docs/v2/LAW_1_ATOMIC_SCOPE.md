# Law 1: Law of Atomic Scope

**A Claim is valid within exactly one scope, and within that scope it constrains all propositions that share its entity.**

A Claim about `(auth.service, provider, Supabase RLS)` with `scope = workspace:main/auth` constrains any future Claim about `(auth.service, provider, ...)` within the `workspace:main/auth` scope. It does not constrain anything outside that scope. It does not constrain Claims about `(auth.service, database, ...)` — those are separate propositions.

*Rationale:* Without atomic scope, Claims become ambient — they apply everywhere, making the system impossible to reason about.