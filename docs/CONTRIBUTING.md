# Contributing

Currently a solo-maintained project. This doc exists so it's ready the moment a collaborator, hire, or open-source contributor joins.

## Before Contributing

Read, in order:
1. `README.md` — what this project is and how it works
2. `docs/ARCHITECTURE.md` — system design and sync model
3. `CLAUDE.md` (repo root) — rules for AI-agent-assisted work
4. `docs/CODING_CONVENTIONS.md` — style and commit conventions

## Setup

```bash
# Clone and install
git clone https://github.com/GetContextly/contextly.git
cd contextly
npm install

# Start local Supabase
cd supabase && supabase start && cd ..

# Copy environment variables
cp .env.example .env
# Fill in Supabase keys from `supabase status`

# Run tests to verify setup
npx vitest run
```

## Making a Change

1. Create a branch off `main` (naming: `feat/short-description`, `fix/short-description`)
2. Make the change, following `docs/CODING_CONVENTIONS.md`
3. Add/update tests — run `npx vitest run` to verify
4. If the change touches an MCP tool's shape, update `docs/API_CONTRACTS.md` in the same commit
5. If the change touches the database schema, it must be a migration file per `docs/SUPABASE_WORKFLOW.md`
6. Type-check all packages: `npx tsc --noEmit` in each package directory
7. Commit with conventional format: `feat(cli): ...`, `fix(mcp): ...`, `docs: ...`

## Commit Convention

```
feat(scope): description
fix(scope): description
test: description
docs: description
chore: description
```

Scopes: `cli`, `mcp-server`, `dashboard`, `shared`, `webhooks`

## Pull Request Expectations

- Small, focused PRs over large ones
- Link to the relevant doc section if implementing something already specified in `/docs`
- If the change represents a new architectural decision, add it to the relevant doc

## Code of Conduct

Be respectful, assume good faith, keep disagreements about the work rather than the person.
