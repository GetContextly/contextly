# The 10-Year Vision: Continuous AI Workers

At this scale:
- Agents run continuously, not per-session
- A single agent may live for years, accumulating a personal Claim DAG that spans projects, organizations, and roles
- The global Claim graph is an evolving artifact that never stops changing

## What Breaks

- Static workspaces (one per project) are insufficient — agents need persistent personal workspaces
- Claim decay must work differently for personal vs organizational Claims
- The constraint compiler must operate in streaming mode, not batch mode

## The Architecture That Survives

- **Personal workspaces**: Every agent has a personal workspace that persists across sessions, projects, and organizations. This workspace contains the agent's history of Claims, filtered through the scopes of the projects it has worked on. When the agent returns to a project, its personal Claims are reconciled with the project's active Claim set.
- **Streaming constraint propagation**: The constraint set is not computed once at session start. It is a streaming computation that updates as new Claims are created, Claims decay, and conflicts are resolved. Agents subscribe to constraint change events and react accordingly.
- **Ephemeral workspaces for tasks**: A short-lived task (review a PR, analyze a bug) creates an ephemeral workspace that inherits from the parent workspace and is discarded after the task completes. The Claims made during the task are merged back to the parent if accepted.