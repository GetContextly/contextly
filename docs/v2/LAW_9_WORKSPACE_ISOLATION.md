# Law 9: Law of Workspace Isolation

**Claims in one workspace do not affect another workspace unless explicitly linked via a cross-workspace reference.**

Cross-workspace references are Claims whose scope includes a workspace prefix (e.g., `workspace:org/policy:auth`). They are inherited by child workspaces unless overridden.

*Rationale:* Without isolation, an experiment in one workspace would corrupt the constraint set of another. Workspace isolation is the fundamental mechanism for parallel exploration.