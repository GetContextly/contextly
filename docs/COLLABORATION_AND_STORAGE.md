# Collaboration & Storage Model

## Storage: Hybrid, Not Cloud-Only or Local-Only

Contextly uses **Postgres (Supabase) as the source of truth**, with a **local `.contextly/` folder as a synced, human-readable mirror** committed to the repo itself.

### Why hybrid
- Cloud-only breaks the CLI-first feel — a dev working offline or wanting to grep their context hits a wall, and it feels like a black box rather than a dev tool
- Local-only breaks multi-agent sync across machines and gives the dashboard nothing centralized to read from
- Hybrid gets the best of both: fast, offline-readable local files, with Supabase handling sync, auth, and team access underneath

### What lives where

| Location | Contents | Committed to git? |
|---|---|---|
| `.contextly/config.json` | Project ID only (safe, public — not a secret) | Yes |
| `.contextly/context.json` (or split files) | Synced mirror of decisions/changes | Yes |
| `.contextly/mcp.json` | Local MCP server connection details, scoped token | **No** — gitignore this, it's per-machine/per-user |
| Supabase (Postgres) | Full source of truth: projects, decisions, changes, members | N/A (cloud) |

**Why commit the context mirror to git:** decisions become visible in normal code review, right alongside the diff that caused them. A reviewer sees not just what changed, but why, without leaving their usual PR workflow. This is a genuine side-benefit worth calling out in marketing — "your architecture decisions get code-reviewed like everything else."

**Why the MCP config must NOT be committed:** it holds a project-scoped token. Treat it like a `.env` file — same instinct devs already have.

---

## Sync Direction

- **Pull:** on `contextly init`, on `contextly sync`, and automatically when an agent's MCP session starts (the "lazy sync" check from ARCHITECTURE.md)
- **Push:** when a new decision is logged — either via CLI (`contextly log`), an agent calling `log_decision()`, or a GitHub webhook event

---

## New Collaborator Flow (CLI-native, minimal browser use)

1. Repo already has `.contextly/config.json` committed, containing the project ID
2. New dev clones the repo, runs `contextly login` once — a one-time, per-machine GitHub OAuth login (not per-project)
3. Dev runs `contextly sync` (or it fires automatically on first agent connection) — CLI checks with Supabase: is this logged-in user a member of this project?
4. **Member already:** pulls full context immediately, zero friction
5. **Not yet a member:** CLI prints a clear message — *"You're not a member of this project yet. Ask an owner to run `contextly invite their@email.com`, or add you from the dashboard."*

The only unavoidable browser moment is the very first OAuth login. Everything else stays in the terminal.

---

## Where the Dashboard Earns Its Place

Given CLI is the primary interface, the dashboard's job is narrow and deliberate — only the things a terminal genuinely does worse:

1. **Member management** — invite/remove people, see who has access (a table beats a CLI list here)
2. **Billing**
3. **Downloadable context exports** — pick a project, download its full context bundle as `.json` or `.md`. Useful for archiving, sharing with a non-technical stakeholder, or reviewing a project you're not actively coding in

Everything else — the actual day-to-day value of the product — never has to touch a browser.

---

## Permission Model Recap (see AUTH.md for full detail)

| Role | Can invite/remove members | Can log decisions | Can export context |
|---|---|---|---|
| Owner | Yes | Yes | Yes |
| Member | No | Yes | Yes |
| Viewer | No | No | Yes |
