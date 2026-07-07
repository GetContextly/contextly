# Contributing

Currently a solo-maintained project. This doc exists so it's ready the moment a collaborator, hire, or open-source contributor joins — better to have it early than to onboard someone with no reference.

## Before Contributing

Read, in order:
1. `docs/README.md` — what this project is
2. `docs/ARCHITECTURE.md` — how it's structured
3. `CLAUDE.md` (repo root) — rules for AI-agent-assisted work, which applies whether a human or an agent is making the change
4. `docs/CODING_CONVENTIONS.md` — style and commit conventions

## Setup

Follow `docs/ENVIRONMENT_SETUP.md` for environment variables, then `docs/SUPABASE_WORKFLOW.md` for local database setup.

## Making a Change

1. Create a branch off `main` (naming: `feat/short-description`, `fix/short-description`)
2. Make the change, following `docs/CODING_CONVENTIONS.md`
3. Add/update tests per `docs/MILESTONES_AND_TESTING.md`'s testing approach
4. If the change touches an MCP tool's shape, update `docs/API_CONTRACTS.md` in the same PR
5. If the change touches the database schema, it must be a migration file per `docs/SUPABASE_WORKFLOW.md`, never a direct dashboard edit
6. Open a PR against `main` with a clear description of what changed and why
7. Update `CHANGELOG.md` if the change is user-facing

## Pull Request Expectations

- Small, focused PRs over large ones — easier to review, easier to revert if something's wrong
- Link to the relevant doc section if the change implements something already specified in `/docs`
- If the change represents a new architectural decision not yet documented, add it to the relevant doc as part of the PR — the docs should never fall behind the actual codebase

## Code of Conduct (short version)

Be respectful, assume good faith, keep disagreements about the work rather than the person. A fuller code of conduct can be adopted later if the project grows a larger contributor base.

## Questions

For anything unclear, reach out via the contact listed in `SECURITY.md` (for security-sensitive questions) or the project's general contact once established.
