# The Interface

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