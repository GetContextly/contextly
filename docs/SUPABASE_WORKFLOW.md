# Supabase CLI Workflow

Using the Supabase CLI instead of only the web dashboard, for proper local development and migration tracking.

## Why This Matters

Making schema changes only in the Supabase dashboard means your database structure lives nowhere in version control — nobody can see what changed, when, or why, and you can't spin up a clean local copy for testing. The CLI fixes this by treating your schema like code.

## Initial Setup

1. Install: `npm install -g supabase` (or via Homebrew on Mac)
2. `supabase login` — authenticates the CLI to your Supabase account
3. Inside the repo root: `supabase init` — creates a `supabase/` folder for config and migrations
4. `supabase link --project-ref <your-project-ref>` — connects the local CLI to your actual hosted project

## Local Development Loop

1. `supabase start` — spins up a full local Supabase stack in Docker (Postgres, Auth, Storage, Studio UI) — lets you develop and test against a local database instead of touching production data
2. Make schema changes as migration files: `supabase migration new add_decisions_table` creates a timestamped SQL file under `supabase/migrations/`
3. Write the actual SQL in that generated file (table creation, RLS policies, etc.)
4. `supabase db reset` — applies all migrations fresh to your local database, good for confirming migrations run cleanly from scratch
5. Test against the local instance (local Studio UI runs at `http://localhost:54323` by default)

## Pushing Changes to the Real Project

- `supabase db push` — applies your local migration files to the actual linked hosted project
- Always test a migration locally first with `db reset` before pushing — a broken migration against production is much harder to walk back

## Generating Types

- `supabase gen types typescript --local > packages/shared/src/database.types.ts` — auto-generates TypeScript types directly from your actual schema, so `packages/shared` types stay in sync with the real database structure instead of being hand-maintained and prone to drifting out of sync

## Recommended Commit Practice

- Commit every migration file — this means your schema history lives in git alongside your code history, and any teammate (or your future self) can rebuild the exact database structure by running migrations in order
- Never hand-edit a migration file that's already been pushed to the real project — write a new migration instead, the same way you wouldn't rewrite git history that's already shared

## Local Edge Functions (if used later for webhook handling)

- `supabase functions new github-webhook` scaffolds a local function
- `supabase functions serve` runs functions locally for testing before deploying
- `supabase functions deploy github-webhook` ships it

## Environment Separation

- Local (`supabase start`) — safe to break, reset constantly, no real data
- Staging project (recommended once you have real signups) — a second Supabase project for testing integration flows (webhooks, OAuth) against something that behaves like production but isn't
- Production — only touched via `db push` after a migration has been proven locally and ideally on staging
