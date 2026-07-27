# The Security Model

### Capability-Based, Not Identity-Based

Access is granted by workspace membership, not by user identity. A workspace membership carries capabilities: `claim`, `merge`, `constrain`, `read`. These capabilities are inherited from parent workspaces.

### Claim-Level Access

A Claim is readable by any member of its workspace. A Claim is writable only by the agent or human that created it (for lifecycle operations like superseding).

### Cross-Workspace References

A Claim in workspace A can reference a Claim in workspace B only if workspace B publishes the referenced Claim to workspace A. Publication is an explicit act (the `publish(workspace, ref)` operation).

### No Service Role

There is no service role key. Every component authenticates with workspace-scoped credentials. The MCP server presents a workspace credential, not a global admin key.