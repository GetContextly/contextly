# Architecture

## System Overview

```
                     ┌─────────────────┐
                     │   Dashboard      │  (Next.js, team view, billing)
                     │  dashboard.pkg   │
                     └────────▲─────────┘
                              │ reads/writes via API
                              │
┌───────────┐        ┌───────┴─────────┐        ┌──────────────┐
│    CLI     │──────▶│    Supabase      │◀──────│  MCP Server   │
│ contextly  │ writes │  (Postgres+Auth) │ reads  │  (agent-facing)│
│   init     │        └───────▲──────────┘        └──────▲───────┘
└───────────┘                 │                          │
                       ┌───────┴────────┐          ┌──────┴──────┐
                       │ GitHub Webhooks │          │  AI Agents   │
                       │ (commits, PRs)  │          │ Claude Code, │
                       └────────────────┘          │ Cursor, etc. │
                                                    └─────────────┘
```

**Four components, one shared database:**

1. **CLI** — one-time setup (`init`), local hook installation, manual decision logging when needed
2. **Supabase (Postgres + Auth)** — the single source of truth; everything else reads/writes here
3. **MCP Server** — the agent-facing interface; this is the actual product from a user's perspective
4. **Dashboard** — human-facing interface for teams; timeline view, billing, settings

---

## Sync Model — "Always Current" Without Being Always-On

Contextly is **not** a 24/7 background daemon. Two lightweight mechanisms create the feeling of constant freshness without the cost or fragility of continuous polling:

### 1. Lazy Sync (on agent connect)
The moment an agent (Claude Code, Cursor) opens an MCP session, the server checks "what's changed since the last snapshot" before serving context. This means freshness is guaranteed exactly when it matters — at the start of a session — with zero cost the rest of the time.

### 2. Hook-Triggered Updates (on git events)
Git commits, merges, and PR events fire a webhook that updates the project's stored context automatically. See [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md) for details.

Together: context is *effectively* always current, without anything running continuously in the background.

---

## Data Flow: A Typical Session

1. Developer opens Claude Code on a Contextly-enabled repo
2. Claude Code connects to the project's MCP server (config is set up during `contextly init`)
3. MCP server does a lazy sync check — anything changed since last session? If yes, pulls latest commits/PRs and updates the stored brief
4. Agent queries context as needed — not a full dump, but targeted questions ("what's the current auth approach?", "why was X rejected?")
5. As the agent works and makes changes, relevant decisions get logged back (either automatically from diffs, or via an explicit "log this decision" call the agent can make)
6. Dashboard shows the updated timeline in plain English for anyone checking in later

---

## The "Ask, Don't Read" Principle

Instead of injecting an entire project brief into an agent's context window (expensive, and most of it irrelevant to the current task), the MCP server exposes **targeted query tools**:

- `get_context(topic)` — returns only what's relevant to a specific area (e.g. "authentication")
- `explain_file(path)` — returns decision history tied to one file
- `recent_changes(since)` — returns a plain-English summary of what changed, not raw diffs
- `log_decision(summary, reasoning)` — agent or dev records a new decision

This keeps token usage low and directly answers the "why not just ask the AI to write a summary doc" objection — a static doc has to be read whole; Contextly answers precisely.

---

## Why Not a Single Monolith?

Splitting CLI / MCP server / dashboard into separate packages (but one shared database) means:
- The MCP server can be lightweight and fast — it's the thing agents talk to constantly, latency matters
- The dashboard can evolve independently (add features, redesign) without touching the agent-facing contract
- The CLI stays a thin, dependency-light tool that's fast to `npx` — nobody wants a slow init
