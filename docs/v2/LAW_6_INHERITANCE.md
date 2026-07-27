# Law 6: Law of Inheritance

**Agents and humans entering a workspace automatically inherit the intersection of all active Claims within that workspace's scope.**

This is not query-based. It is automatic. The constraint set is computed at session start and injected into the agent's context. The agent does not ask "what constraints apply?" — it receives them.

*Rationale:* If an agent must ask for constraints, it will forget to ask. The system must push constraints, not wait for pull.