# Contextly

**Living project memory for AI coding agents.**

Contextly keeps a structured, always-current brief of your project — architecture, decisions, recent changes — that any AI coding agent (Claude Code, Cursor, Copilot, etc.) can query instead of you re-explaining everything every session.

Domain: getcontextly.dev

---

## Why This Exists

- AI coding sessions start from zero context every time
- Hitting a usage limit mid-task means losing time re-explaining to a fresh session or different tool
- Manually written summary docs go stale within days
- Teams using multiple AI tools get inconsistent output because each tool has a different picture of the project

Contextly fixes this by capturing context passively (via git hooks and agent sessions) and serving it through an MCP server any agent can connect to.

---

## Planned Repo Structure

This is the target monorepo layout once building starts:

```
contextly/
├── packages/
│   ├── cli/              # npx contextly init — scans repo, sets up hooks
│   ├── mcp-server/       # The core product — agents connect here
│   ├── dashboard/        # Next.js web app — team view, timeline, billing
│   └── shared/           # Shared types/schemas used by all packages
├── supabase/
│   └── schema.sql        # Database schema (see DATA_MODEL.md)
├── docs/                 # This documentation set
├── .github/
│   └── workflows/        # CI + dogfooding hooks
└── package.json          # npm workspaces root
```

**Suggested build order:**
1. `shared` — define types first, everything else depends on them
2. `cli` — get `init` working locally against a test repo
3. `mcp-server` — wire up one agent (Claude Code) reading from it
4. `dashboard` — once the data model is proven out via CLI/MCP

---

## Documentation Index

| Doc | Covers |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | How the pieces fit together, sync model, data flow |
| [AUTH.md](./docs/AUTH.md) | Login, session handling, team/role access |
| [GITHUB_INTEGRATION.md](./docs/GITHUB_INTEGRATION.md) | Webhooks, hook-triggered capture, PR/commit parsing |
| [MCP_AGENT_INTEGRATION.md](./docs/MCP_AGENT_INTEGRATION.md) | How Claude Code/Cursor/etc. actually pick up a Contextly project |
| [DATA_MODEL.md](./docs/DATA_MODEL.md) | Database schema and entity relationships |
| [ROADMAP.md](./docs/ROADMAP.md) | Build phases, v1 vs v2 feature scope |

---

## Tech Stack (planned)

- **CLI:** Node.js, npx-installable
- **MCP server:** Node.js/TypeScript, `@modelcontextprotocol/sdk`
- **Dashboard:** Next.js 14 + Tailwind
- **Database/Auth:** Supabase (Postgres + built-in auth)
- **Hosting:** Vercel (dashboard + API), separate lightweight host for the MCP server
- **Git integration:** GitHub Webhooks + GitHub Actions
