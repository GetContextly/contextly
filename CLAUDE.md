# CLAUDE.md

Instructions for any AI coding agent (Claude Code, Cursor, etc.) working in this repo. Read this before making any change.

## What This Project Is

Contextly is a living project memory layer for developers using multiple AI coding agents. Full context lives in `/docs` — read the relevant doc before implementing anything non-trivial. Do not guess at architecture decisions that are already documented.

**Read these first, in this order, before touching code:**
1. `docs/README.md` — overview and repo structure
2. `docs/ARCHITECTURE.md` — system design and sync model
3. `docs/DATA_MODEL.md` — database schema
4. `docs/API_CONTRACTS.md` — exact MCP tool signatures (do not deviate from these without flagging it)
5. Whichever other doc matches the package you're working in (e.g. `docs/AUTH.md` for auth work, `docs/GITHUB_INTEGRATION.md` for webhook work)

## Monorepo Structure

```
packages/
├── cli/            # npx contextly — Node.js, commander
├── mcp-server/      # MCP server, @modelcontextprotocol/sdk
├── dashboard/       # Next.js dashboard
└── shared/          # Shared types, generated Supabase types
```

Never duplicate a type that already exists in `packages/shared` — import it. If a type needs to change, change it in `shared` first, then update dependents.

## Rules — Do Not Violate These

- **Never hand-edit `packages/shared/src/database.types.ts`.** It's generated from the Supabase schema via `supabase gen types typescript`. If the schema needs to change, write a migration (see `docs/SUPABASE_WORKFLOW.md`), then regenerate types.
- **Never write directly to Supabase schema via the dashboard/SQL editor.** All schema changes go through `supabase migration new <name>`, committed as files. This is non-negotiable — it's the only way the schema stays in version control.
- **Never commit `.env` files or any file under `.contextly/mcp.json`.** These contain secrets/tokens. Check `.gitignore` covers them before any commit that touches config.
- **Never modify an MCP tool's input/output shape without updating `docs/API_CONTRACTS.md` in the same commit.** The CLI, MCP server, and dashboard all depend on this contract staying accurate — a silent mismatch here is the most likely source of confusing bugs in this project.
- **Do not add new npm dependencies without checking if `packages/shared` or an existing package already solves the problem.** Keep the dependency tree lean — this is a CLI-first tool, and `npx contextly init` needs to stay fast.

## Before Every Commit

1. Run relevant tests for the package you touched (`npm test -w packages/<name>`)
2. If you touched a database-adjacent file, confirm `supabase db reset` still applies cleanly
3. If you touched an MCP tool, manually verify it against `docs/API_CONTRACTS.md`
4. Write a commit message following the convention in `docs/CODING_CONVENTIONS.md` (e.g. `feat(cli): ...`, `fix(mcp): ...`)
5. Prefer small, single-purpose commits — see `docs/MILESTONES_AND_TESTING.md` for the expected granularity

## When Uncertain

If a task requires a decision that isn't covered in `/docs` (e.g. "should this be a new table or a JSON column?"), stop and ask rather than guessing — then, once decided, the decision should be added back into the relevant doc so the next session doesn't have to re-decide it.

## What NOT to Touch Without Explicit Instruction

- Pricing logic in the billing package — dollar amounts and tier boundaries are business decisions, not engineering ones
- RLS policies — these are security-critical; changes need explicit review, not quiet edits as a side effect of an unrelated feature
- The bot-commit mechanism in GitHub integration — this writes back to users' real repos; any change here needs to be deliberate and tested against a throwaway repo first, never live
