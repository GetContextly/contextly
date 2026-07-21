# API Contracts

Exact, fixed input/output signatures for every MCP tool. This is the single source of truth for the agent-facing contract — the CLI, MCP server, and dashboard must all agree with this doc. If an implementation needs to differ, update this doc in the same commit, don't let them drift apart silently.

> **Status:** All 4 MCP tools and all CLI commands are implemented and tested (as of July 2026).

---

## MCP Tools (agent-facing)

### `get_context`

**Input:**
```typescript
{
  topic: string;        // e.g. "authentication", "database schema"
  project_id: string;   // scoped automatically from the connection token, not passed by the agent directly
}
```

**Output:**
```typescript
{
  summary: string;              // plain-English answer
  related_decisions: Decision[]; // see Decision type below
  last_updated: string;         // ISO 8601 timestamp
}
```

**Behavior notes:**
- If no relevant decisions exist for the topic, return `summary: "No recorded context for this topic yet."` and an empty `related_decisions` array — never an error
- `related_decisions` should be sorted most-recent-first, capped at 5 entries to control token usage

---

### `explain_file`

**Input:**
```typescript
{
  path: string;         // relative file path, e.g. "src/auth/login.ts"
  project_id: string;   // scoped from connection token
}
```

**Output:**
```typescript
{
  summary: string;
  related_decisions: Decision[];
  file_exists_in_repo: boolean;   // false if path doesn't match anything in the last known scan
}
```

**Behavior notes:**
- If the file has no logged decisions, still return `file_exists_in_repo` accurately with an empty `related_decisions` array
- Do not fabricate a summary if there's no data — return `summary: "No decisions recorded for this file."`

---

### `recent_changes`

**Input:**
```typescript
{
  since: string;         // ISO 8601 timestamp, or relative shorthand like "1h", "1d", "7d"
  project_id: string;
}
```

**Output:**
```typescript
{
  changes: Change[];     // see Change type below
  decisions: Decision[]; // any decisions logged in the same window
}
```

**Behavior notes:**
- `since` shorthand parsing must be handled consistently in one shared utility (in `packages/shared`), not reimplemented per package
- Cap `changes` at 20 entries to avoid flooding agent context; note in the response if entries were truncated

---

### `log_decision`

**Input:**
```typescript
{
  summary: string;        // required, plain-English one-liner
  reasoning: string;      // required, the "why"
  related_files?: string[]; // optional
  project_id: string;     // scoped from connection token
}
```

**Output:**
```typescript
{
  id: string;            // UUID of the created decision
  created_at: string;    // ISO 8601 timestamp
}
```

**Behavior notes:**
- `source` field is set server-side to `"agent_logged"` — not something the agent passes in
- Reject empty `summary` or `reasoning` with a clear validation error, don't silently create a blank entry

---

## Shared Types Referenced Above

```typescript
type Decision = {
  id: string;
  project_id: string;
  summary: string;
  reasoning: string;
  source: "git_commit" | "pull_request" | "agent_logged" | "manual";
  related_files: string[];
  created_at: string; // ISO 8601
};

type Change = {
  id: string;
  project_id: string;
  summary: string;
  commit_sha: string | null;
  created_at: string; // ISO 8601
};
```

These must live in `packages/shared/src` as the single canonical definition — every package imports from there, none redefine them locally.

---

## CLI Command Contracts

### `contextly init`
- No required flags for basic use
- Optional: `--yes` (skip confirmation prompts, useful for CI)
- Side effects: creates `.contextly/config.json` (committed), `.contextly/mcp.json` (gitignored)
- Exit code `0` on success, non-zero with a clear stderr message on any failure — never exit `0` on partial failure

### `contextly login`
- No arguments — always triggers GitHub OAuth flow
- Side effect: stores a global (not per-project) auth token in a user-level config directory, not inside any repo

### `contextly sync`
- No required arguments
- Optional: `--force` (skip the lazy-sync freshness check, pull regardless)
- Exit code non-zero if the user isn't a member of the project, with the exact error message specified in `docs/COLLABORATION_AND_STORAGE.md`

### `contextly log`
- Required: a message argument (`contextly log "switched to supabase auth"`)
- Optional: `--reasoning "<text>"` flag for the longer explanation; if omitted, prompt interactively

---

## Versioning This Contract

Any breaking change to a tool's input/output shape must:
1. Be reflected in this doc in the same commit
2. Bump the MCP protocol version referenced in `docs/MILESTONES_AND_TESTING.md` Phase 9
3. Be tested against an intentionally-outdated client to confirm a graceful version-mismatch error, not a silent break
