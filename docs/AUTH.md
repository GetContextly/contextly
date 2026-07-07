# Authentication & Access

## Who Needs to Log In, and When

| Actor | Needs login? | Why |
|---|---|---|
| Solo dev, local-only free tier | No | CLI works against a local config file, no account needed |
| Solo dev, hosted (Pro) | Yes | Context is stored remotely, needs to be tied to an account |
| Team member | Yes | Needs role-based access to a shared project brief |
| AI agent (MCP client) | No direct login | Authenticates via a project-scoped token, not a human login flow |

---

## Human Login Flow (Dashboard)

Use **Supabase Auth** — it's the fastest path to a working, secure login system without building auth from scratch.

**Supported methods (recommended for v1):**
- GitHub OAuth (primary — your users are developers, they already have GitHub, and it lets you request repo access in the same flow)
- Email + magic link (fallback for anyone who doesn't want to link GitHub immediately)

**Why GitHub OAuth specifically matters here:** signing in with GitHub can double as the permission grant for reading repo metadata and installing webhooks, so you avoid a separate "connect your GitHub" step later. One flow does two jobs.

**Technical note:** implement this as a **GitHub App** (not a plain OAuth App). A GitHub App can handle user login (via its own OAuth flow) *and* be installed on repos to receive webhooks *and* make authenticated commits back to the repo (see the automated commit-back mechanism in `GITHUB_INTEGRATION.md`) — all under one registration, with fine-grained, repo-scoped permissions rather than broad account-wide OAuth scopes. A plain OAuth App can't do the repo-write commit-back part cleanly. One GitHub App registration covers all three jobs.

**Session handling:**
- Supabase issues a JWT on login, stored client-side
- Dashboard requests include the JWT; Supabase Row Level Security (RLS) policies enforce that users only see projects they belong to
- No custom session logic needed — this is Supabase's built-in behavior when RLS is set up correctly on your tables

---

## Agent Authentication (MCP Server)

Agents don't "log in" the way a human does. Instead:

1. During `contextly init`, the CLI generates a **project-scoped API token** tied to the logged-in user's account
2. This token is written to a local MCP config file (e.g. `.contextly/mcp-config.json`) that Claude Code / Cursor read when connecting to the MCP server
3. The MCP server validates the token on every request — it identifies *which project* the agent is working on, not which human is typing

**Token scope matters:** a project token should only grant access to that one project's context, not the user's entire account. This limits blast radius if a token leaks (e.g. accidentally committed to a public repo).

**Token rotation:** support regenerating a project's token from the dashboard, in case one is exposed.

---

## Team Roles (for the Team tier)

Minimum viable role model for v1:

| Role | Can do |
|---|---|
| Owner | Manage billing, add/remove members, regenerate tokens, delete project |
| Member | Read/write context, log decisions, view dashboard timeline |
| Viewer | Read-only — see the timeline, can't log decisions or change settings |

This maps cleanly to Supabase RLS policies: each row (project, decision, change) carries a `project_id`, and policies check the requesting user's role in a `project_members` join table before allowing read/write.

---

## Security Notes to Keep in Mind

- Never expose project tokens in the dashboard UI in full after initial generation — show a masked version, allow regeneration
- Webhook secrets (from GitHub) should be stored server-side only, never sent to the client
- Rate-limit the MCP server per token to prevent abuse or runaway agent loops from hammering it
