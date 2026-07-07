# Environment Setup

Exact environment variables needed across all packages. Copy `.env.example` (below) to `.env` at the repo root and fill in real values — never commit the filled-in `.env`.

## `.env.example` (create this file at repo root)

```bash
# --- Supabase ---
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here   # server-side only, NEVER expose to client/dashboard frontend

# --- GitHub OAuth (for login + webhook setup) ---
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-signing-secret

# --- Stripe (billing) ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...          # Pro tier $10/mo price ID from Stripe dashboard

# --- MCP Server ---
MCP_SERVER_PORT=7420
MCP_SERVER_PUBLIC_URL=http://localhost:7420   # update to real hosted URL post-deploy

# --- Dashboard (Next.js) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- General ---
NODE_ENV=development
```

## Where Each Key Comes From

| Variable | Source |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same location — **treat this like a root password**, it bypasses RLS entirely |
| `GITHUB_CLIENT_ID/SECRET` | GitHub → Settings → Developer Settings → OAuth Apps (create one for Contextly) |
| `GITHUB_WEBHOOK_SECRET` | You generate this yourself (any strong random string) — used to verify incoming webhook payloads |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (use test mode key until launch) |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Developers → Webhooks (or from `stripe listen` output during local dev) |
| `STRIPE_PRICE_ID_PRO` | Stripe dashboard → Products, after creating the Pro price |

## Critical Rule: Client vs Server Keys

- Anything prefixed `NEXT_PUBLIC_` is exposed to the browser — **never** put a secret key behind this prefix
- `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in server-side code (MCP server, webhook handlers) — if this leaks, RLS protection is meaningless, since it bypasses RLS by design
- Double-check `.gitignore` includes `.env`, `.env.local`, and any `*.env` variant before your very first commit

## Local Development Setup Order

1. `supabase start` (see `docs/SUPABASE_WORKFLOW.md`) — get local Supabase running first
2. Copy `.env.example` to `.env`, fill in local Supabase values (printed by `supabase start`) plus your real GitHub OAuth app and Stripe test keys
3. `npm install` at repo root
4. `npm run dev` to start all packages via Turborepo, or run individual packages (`npm run cli`, `npm run mcp`, `npm run dashboard`)

## Per-Environment Notes

- **Local:** use `supabase start`'s local values, Stripe test mode, a GitHub OAuth app configured with `localhost` callback URLs
- **Staging** (recommended once real signups start): separate Supabase project, separate GitHub OAuth app (different callback URL), Stripe still in test mode
- **Production:** real Supabase project, real GitHub OAuth app with production callback URL, Stripe live mode keys — only switch to live Stripe keys once billing has been fully tested in test mode per `docs/MILESTONES_AND_TESTING.md` Phase 8
