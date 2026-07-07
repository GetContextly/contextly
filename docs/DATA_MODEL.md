# Data Model

## Core Entities

### `users`
Managed by Supabase Auth — no custom table needed beyond what Supabase provides, unless storing extra profile fields.

### `projects`
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| name | text | |
| github_repo_url | text | linked repo, if any |
| owner_id | uuid | references users |
| mcp_token | text | scoped token, shown masked after creation |
| created_at | timestamp | |

### `project_members`
Join table for team access — see AUTH.md for role definitions.
| Field | Type | Notes |
|---|---|---|
| project_id | uuid | references projects |
| user_id | uuid | references users |
| role | text | `owner` \| `member` \| `viewer` |

### `decisions`
The core "why" record — what makes Contextly more than a changelog.
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| project_id | uuid | references projects |
| summary | text | plain-English one-liner |
| reasoning | text | the "why," longer form |
| source | text | `git_commit` \| `pull_request` \| `agent_logged` \| `manual` |
| related_files | text[] | optional, for `explain_file` queries |
| created_at | timestamp | |

### `changes`
Routine changes that don't rise to the level of a "decision" but still matter for `recent_changes` queries.
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| project_id | uuid | references projects |
| summary | text | plain-English summary of the change |
| commit_sha | text | nullable |
| created_at | timestamp | |

### `agent_sessions` (optional, useful for analytics + debugging)
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| project_id | uuid | references projects |
| agent_type | text | `claude_code` \| `cursor` \| `other` |
| connected_at | timestamp | |
| last_sync_at | timestamp | supports the lazy-sync check |

---

## Relationships

```
users ──< project_members >── projects ──< decisions
                                  │
                                  ├──< changes
                                  └──< agent_sessions
```

- One project has many decisions and changes
- One project has many members (via `project_members`), each with a role
- A user can belong to multiple projects

---

## Row Level Security (RLS) Notes

Since Supabase enforces access at the database layer, RLS policies should generally follow this pattern for every project-scoped table:

> "Allow read/write if the requesting user has a row in `project_members` for this `project_id`, and (for write operations) their role is `owner` or `member`, not `viewer`."

This keeps access control consistent without needing to duplicate permission checks in application code everywhere.

---

## Why Separate `decisions` and `changes`

Keeping these as two distinct tables (rather than one generic "events" table with a type flag) makes two things easier:
- Dashboard queries that only want the meaningful timeline (decisions) without noise
- Different retention/summarization logic later — e.g. changes could be pruned or compacted after a while, decisions should persist indefinitely
