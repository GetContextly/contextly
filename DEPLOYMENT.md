# Deployment

How each piece of Contextly actually ships, and how to roll back if something breaks.

## CLI → npm

**Publishing:**
1. Bump version in `packages/cli/package.json` following semver (patch for fixes, minor for new features, major for breaking changes)
2. Update `CHANGELOG.md` with what changed
3. `npm run build -w packages/cli`
4. `npm publish -w packages/cli` (requires npm login with publish access to the package name)
5. Tag the release in git: `git tag v0.x.x && git push --tags`

**Rollback:**
- npm doesn't allow overwriting a published version — if a bad version ships, publish a new patch version with the fix immediately
- `npm deprecate contextly@0.x.x "This version has a known issue, please upgrade"` to warn anyone who installs the bad version directly

## MCP Server

**Where it runs:** needs to be always-reachable (agents connect to it constantly), so a lightweight always-on host — Railway, Render, or Fly.io are reasonable choices for a Node process that isn't a good fit for Vercel's serverless model (long-lived connections don't suit serverless well)

**Deploy steps (adapt to whichever host is chosen):**
1. Push to the deployment branch (or trigger via the host's CLI/dashboard)
2. Confirm environment variables are set on the host (see `ENVIRONMENT_SETUP.md`) — these are separate from your local `.env`
3. Run a smoke test immediately after deploy: connect a real agent, call `get_context` on a known test project, confirm a correct response

**Rollback:**
- Keep the previous deployment/version available to instantly redeploy (most hosts keep recent deploy history — use "redeploy previous version" rather than trying to manually revert code under pressure)
- If a bad deploy breaks tool responses, prioritize rollback speed over root-causing in the moment — debug after service is restored

## Dashboard → Vercel

**Deploy steps:**
1. Connect the `packages/dashboard` directory as the Vercel project root
2. Set environment variables in Vercel's dashboard (the `NEXT_PUBLIC_*` and server-side ones from `ENVIRONMENT_SETUP.md`)
3. Vercel auto-deploys on push to main; use preview deployments (automatic on PRs) to check changes before merging

**Rollback:**
- Vercel keeps every deployment — use "Promote to Production" on a previous known-good deployment directly from the dashboard, this is close to instant

## Database Migrations

- Migrations are applied via `supabase db push` (see `SUPABASE_WORKFLOW.md`) — this should happen as a deliberate, separate step from code deploys, not bundled automatically into a CI pipeline until you're confident in the migration review process
- **Never** run `db push` against production without first running `db reset` locally to confirm the migration applies cleanly from scratch

## Suggested Release Checklist (before any version bump)

1. All tests passing (`npm test` at root, runs across all packages via Turborepo)
2. Manually run through the Phase 3 checkpoint test from `MILESTONES_AND_TESTING.md` (the core agent-switching scenario) — this is the one thing that must never silently regress
3. `CHANGELOG.md` updated
4. Environment variables confirmed present on every host (MCP server, Vercel) if this release adds a new one
