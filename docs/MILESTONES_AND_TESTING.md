# Contextly — Milestones & Testing Plan

Target: ~200 commits across an 8-week build. That averages to roughly **25 commits/week, 3-5 per working day** — meaning commits should be small and granular (one working piece at a time), not large batched dumps. Each task below is sized to be roughly one commit. Every task has a paired test step — do the test *before* moving to the next task, not at the end of the week.

---

## Phase 0 — Setup & Foundations (Week 1, Days 1-2)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 1 | Initialize monorepo (npm workspaces or Turborepo), root `package.json`, `.gitignore` | `chore: initialize monorepo structure` | Run `npm install` at root, confirm no errors |
| 2 | Create `packages/shared` with base `tsconfig.json` | `chore: scaffold shared package` | `npm run build -w packages/shared` compiles with no errors |
| 3 | Install Supabase CLI, `supabase init`, `supabase login`, `supabase link` to real project (see SUPABASE_WORKFLOW.md) | `chore: set up supabase cli and link project` | `supabase status` shows linked project correctly |
| 3b | `supabase start` — confirm local stack runs (Docker) | `chore: verify local supabase stack` | Local Studio UI loads at localhost:54323 |
| 4 | Write initial schema as a migration (`supabase migration new init_schema`) — tables from DATA_MODEL.md | `feat(db): create initial schema via migration — projects, decisions, changes, members` | `supabase db reset` applies cleanly with no errors; tables visible in local Studio |
| 5 | Write RLS policies as their own migration | `feat(db): add row level security policies` | Test with two fake users locally, confirm one can't see the other's project rows; then `supabase db push` to real project and repeat the test there |
| 5b | Generate TypeScript types from schema | `chore: generate database types from schema` | `packages/shared/src/database.types.ts` reflects actual table structure, imports cleanly |
| 6 | Set up GitHub repo for Contextly itself, push initial commit | `chore: initial commit` | Repo visible on GitHub, README renders |

**Phase 0 checkpoint test:** Can you connect to Supabase from a throwaway Node script and successfully insert + read a row respecting RLS? If not, don't move forward — this is the foundation everything else sits on.

---

## Phase 1 — Shared Types (Week 1, Days 3-4)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 7 | Define `Project`, `Decision`, `Change`, `ProjectMember` types | `feat(shared): define core entity types` | TypeScript compiles with no `any` leaks; import types into a scratch file in another package to confirm they resolve |
| 8 | Define MCP tool input/output types (`get_context`, `explain_file`, `recent_changes`, `log_decision`) | `feat(shared): define MCP tool schemas` | Write a quick unit test asserting a sample object matches each type shape |
| 9 | Define Supabase client wrapper (single shared instance/config) | `feat(shared): add supabase client wrapper` | Import wrapper in a scratch script, confirm it connects |

**Phase 1 checkpoint test:** Write 3-5 small unit tests (Vitest or Jest) covering type guards/validation functions. Run `npm test -w packages/shared` — all green before moving on.

---

## Phase 2 — CLI Core (Week 2)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 10 | Scaffold CLI package with `commander` (or similar), basic `--help` output | `feat(cli): scaffold CLI with commander` | Run `npx contextly --help` locally, confirm command list prints |
| 11 | Build `contextly login` (GitHub OAuth device flow or browser redirect) | `feat(cli): implement login command` | Run it against a real GitHub test account, confirm token gets stored locally |
| 12 | Build repo scan logic (detect stack, folder structure) for `init` | `feat(cli): add repo scanning logic` | Run against 2-3 of your own real repos (different stacks) — manually verify detected stack matches reality |
| 13 | Build `contextly init` — combines scan + writes `.contextly/config.json` | `feat(cli): implement init command` | Run in a fresh test repo, confirm `.contextly/` folder appears with correct project ID |
| 14 | Build `.contextly/mcp.json` generation (gitignored) | `feat(cli): generate local mcp config` | Confirm file is created, confirm it's excluded via `.gitignore`, confirm token isn't logged to console |
| 15 | Build `contextly sync` (pull latest from Supabase into local mirror) | `feat(cli): implement sync command` | Manually insert a test decision into Supabase, run `sync`, confirm it appears in local `context.json` |
| 16 | Build `contextly log` (manual decision logging from terminal) | `feat(cli): implement log command` | Run it, confirm the decision appears both locally and in Supabase |
| 17 | Handle the "not a member yet" case gracefully | `feat(cli): handle unauthorized project access` | Test with a second GitHub account not added to the test project — confirm clear error message, not a crash |

**Phase 2 checkpoint test:** Full manual walkthrough — clone a fresh test repo, run `login` → `init` → make a commit → `sync` → `log`. Confirm the entire loop works with zero unexpected errors. Do this test on two different machines if possible, to confirm cross-machine sync actually works (this is the core value prop).

---

## Phase 3 — MCP Server (Weeks 3-4)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 18 | Scaffold MCP server using `@modelcontextprotocol/sdk` | `feat(mcp): scaffold server` | Server starts locally without errors (`npm run dev -w packages/mcp-server`) |
| 19 | Implement token validation middleware | `feat(mcp): add token auth middleware` | Send a request with a bad token, confirm rejection; with a valid token, confirm it passes |
| 20 | Implement `get_context(topic)` tool | `feat(mcp): implement get_context tool` | Call it manually (via a test script or MCP inspector tool) with a known topic, confirm relevant decisions return |
| 21 | Implement `explain_file(path)` tool | `feat(mcp): implement explain_file tool` | Test against a file with logged decisions vs. one with none — confirm correct behavior in both cases |
| 22 | Implement `recent_changes(since)` tool | `feat(mcp): implement recent_changes tool` | Insert test changes with varying timestamps, confirm filtering by `since` works correctly |
| 23 | Implement `log_decision(summary, reasoning)` tool | `feat(mcp): implement log_decision tool` | Call it, confirm entry appears in Supabase with correct `source: agent_logged` |
| 24 | Implement lazy sync check on session connect | `feat(mcp): add lazy sync on connect` | Make a change via GitHub, connect a session, confirm sync fires before first tool call |
| 25 | Connect Claude Code to the running MCP server (real, not mocked) | `feat(mcp): verify claude code connection` | In an actual Claude Code session, call each tool manually and confirm real responses come back |

**Phase 3 checkpoint test:** This is the single most important test in the whole project — open Claude Code on a real repo with Contextly connected, ask it a question that requires calling `get_context`, and confirm it does so correctly and uses the result sensibly in its response. If this doesn't feel smooth, stop and fix it before adding anything else.

---

## Phase 4 — GitHub Integration (Week 4-5)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 26 | Set up webhook endpoint (receives GitHub events) | `feat(github): scaffold webhook endpoint` | Use a tool like `ngrok` to expose it locally, send a test payload via GitHub's webhook test button, confirm receipt |
| 27 | Implement webhook signature verification | `feat(github): verify webhook signatures` | Send a payload with a bad signature, confirm rejection |
| 28 | Implement commit event handling → logs as "change" | `feat(github): handle push events`| Push a real commit to a test repo, confirm a `changes` row appears in Supabase |
| 29 | Implement `--context` flag detection → logs as "decision" | `feat(github): detect decision-flagged commits` | Commit with and without the flag, confirm correct table/classification each time |
| 30 | Implement merged PR handling → summarized decision | `feat(github): handle merged pull requests` | Merge a test PR, confirm a decision entry appears with a reasonable summary |
| 31 | Implement bot account commit-back of `.contextly/context.json` | `feat(github): add bot commit for context mirror` | After triggering an update, confirm a bot commit appears in the test repo with the updated file |
| 32 | Add ignore-list support (exclude noisy paths) | `feat(github): support ignore-list config` | Add `node_modules` to ignore list, push a change touching it, confirm no context update fires |

**Phase 4 checkpoint test:** Simulate a full team scenario — commit as one "user," merge a PR as another, confirm both are captured correctly and the bot-committed mirror file updates and stays accurate.

---

## Phase 5 — Dashboard (Weeks 5-6)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 33 | Scaffold Next.js dashboard app | `feat(dashboard): scaffold next.js app` | `npm run dev -w packages/dashboard`, confirm blank app loads |
| 34 | Implement Supabase Auth login (GitHub OAuth) | `feat(dashboard): implement login flow` | Log in with a real test account, confirm session persists on refresh |
| 35 | Build project list view | `feat(dashboard): add project list view` | Confirm only projects the logged-in user belongs to are shown |
| 36 | Build decision/change timeline view | `feat(dashboard): add timeline view` | Compare timeline entries against known Supabase rows — confirm accuracy and correct plain-English rendering |
| 37 | Build member management (invite/remove) | `feat(dashboard): add member management` | Invite a second real test account, confirm they gain access via CLI `sync` afterward |
| 38 | Build manual decision entry (dashboard-side logging) | `feat(dashboard): add manual decision entry` | Log a decision from the dashboard, confirm it appears in CLI's local mirror after `sync` |
| 39 | Build context export (download `.json`/`.md`) | `feat(dashboard): add context export` | Download the export, open it, confirm it matches what's actually stored |
| 40 | Build basic billing scaffold (even placeholder Free/Pro toggle) | `feat(dashboard): scaffold billing tier display` | Confirm tier displays correctly per test account |

**Phase 5 checkpoint test:** Full role-based test — create three test accounts (Owner, Member, Viewer), confirm each can/can't do exactly what AUTH.md specifies. Any mismatch here is a security bug, not a cosmetic one — treat it as blocking.

---

## Phase 6 — Second Agent + Polish (Weeks 7-8)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 41 | Connect Cursor to the MCP server | `feat(mcp): verify cursor connection` | Run the exact "switching agents mid-task" scenario from MCP_AGENT_INTEGRATION.md — start in Claude Code, switch to Cursor, confirm continuity |
| 42 | Fix rough edges found from real dogfooding on your own client repos | `fix: [specific issue found]` | Re-run the full Phase 2/3 checkpoint tests after each fix |
| 43 | Add graceful empty-state handling (brand-new project, no history) | `fix(mcp): handle empty project state` | Run `init` on a totally fresh repo, confirm no errors, confirm a sensible default response |
| 44 | Add rate limiting to MCP server | `feat(mcp): add rate limiting` | Send a burst of requests, confirm limiting kicks in without breaking normal usage |
| 45 | Final review pass on all docs vs. actual behavior | `docs: sync documentation with final implementation` | Read through each doc, manually verify every claimed behavior against the real running system |

**Phase 6 checkpoint test:** Recruit one real outside developer (not you) to run through `init` → connect an agent → use it for a real task, with zero help from you. Watch where they get stuck. That's your actual pre-launch bug list.

---

## Phase 7 — Authentication Hardening (Week 6, alongside Dashboard work)

The earlier auth tasks (login working, RLS enforced) get you a functioning system. This phase makes it a *correct* one — the difference between "logs in fine when I test it" and "won't quietly break or leak access six months from now."

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 46 | Implement session refresh (Supabase handles this, but wire up client-side handling of expired/refreshed tokens) | `feat(auth): handle session refresh` | Leave a session open past its expiry window, confirm it refreshes silently instead of logging the user out |
| 47 | Implement logout (clear session both client-side and any cached local state) | `feat(auth): implement logout flow` | Log out, confirm dashboard immediately denies access to previously-visible data, no stale cached views |
| 48 | Implement project token rotation (dashboard button to regenerate) | `feat(auth): add token rotation` | Regenerate a token, confirm the *old* token immediately stops working against the MCP server |
| 49 | Implement token scope enforcement tests | `test(auth): verify token scope boundaries` | Confirm a valid token for Project A cannot read/write Project B's data, even by directly guessing IDs |
| 50 | Handle revoked GitHub OAuth access gracefully | `feat(auth): handle revoked github access` | Revoke Contextly's access from your GitHub account settings, confirm the app detects this and prompts re-auth instead of silently failing |
| 51 | Add basic audit log for auth-sensitive actions (login, token regeneration, member removal) | `feat(auth): add audit log for sensitive actions` | Perform each action, confirm an entry is recorded with actor, action, and timestamp |
| 52 | Rate-limit login attempts / token validation endpoint | `feat(auth): add rate limiting to auth endpoints` | Send a burst of invalid attempts, confirm throttling kicks in |

**Phase 7 checkpoint test:** Have a second person (not you) attempt to access a project they're not a member of, using every method they can think of (guessing project IDs, reusing an old token, direct API calls). Nothing should work. Auth bugs are the ones that quietly cost you the most trust later — treat this checkpoint as blocking, not optional polish.

---

## Phase 8 — Payments & Billing (Week 6-7)

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 53 | Set up Stripe account (test mode), get API keys | `chore: add stripe test config` | Confirm test dashboard is accessible, test keys work in a scratch script |
| 54 | Define products/prices in Stripe (Free — $0, Pro — $10/mo) | `chore: configure stripe products and prices` | Prices visible correctly in Stripe dashboard |
| 55 | Implement Stripe Checkout session creation (upgrade flow) | `feat(billing): implement checkout session creation` | Click "Upgrade" in dashboard, confirm redirect to a real Stripe test checkout page |
| 56 | Implement Stripe webhook handler (`checkout.session.completed`, `customer.subscription.updated/deleted`) | `feat(billing): handle stripe webhooks` | Use Stripe CLI (`stripe listen --forward-to`) to simulate events locally, confirm each updates the user's tier correctly in Supabase |
| 57 | Implement tier enforcement (gate hosted sync / unlimited projects behind Pro) | `feat(billing): enforce tier limits` | As a Free-tier test account, confirm hitting a Pro-only feature is blocked with a clear upgrade prompt, not a silent failure or crash |
| 58 | Implement subscription cancellation flow | `feat(billing): implement cancellation flow` | Cancel a test subscription, confirm access downgrades at the correct time (end of billing period, not instantly, unless that's the intended policy — decide and document this) |
| 59 | Implement billing portal link (Stripe's hosted customer portal) | `feat(billing): add billing portal access` | Click through from dashboard, confirm it opens Stripe's real portal for that test customer |
| 60 | Handle failed payments gracefully (dunning) | `feat(billing): handle failed payment webhook` | Simulate a failed payment via Stripe test cards, confirm the user gets a clear in-app notice, not just silent downgrade |

**Phase 8 checkpoint test:** Full paid-user lifecycle test in Stripe test mode — sign up free, upgrade to Pro, confirm feature access changes immediately, cancel, confirm downgrade happens correctly at the right time. Do this test with a real test card number (Stripe provides these) rather than only checking database rows — the actual checkout UX matters as much as the backend logic.

---

## Phase 9 — Updates & Versioning Strategy (Week 7)

This covers what happens *after* launch, when the CLI, MCP server, and schema all need to evolve without breaking existing users mid-flight — worth building the mechanism now rather than retrofitting it under pressure later.

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 61 | Add version field to CLI (`contextly --version`), publish with semantic versioning | `chore: add cli versioning` | Running `--version` reports the correct published version |
| 62 | Implement CLI update check (compares local version against latest on npm, prompts if outdated) | `feat(cli): add update check` | Manually publish a fake newer version to a test npm scope, confirm the CLI detects and prompts |
| 63 | Implement MCP server protocol version negotiation (so an old CLI/agent talking to a newer server fails gracefully, not silently) | `feat(mcp): add protocol version check` | Point an intentionally-old local CLI build at a newer test server, confirm a clear "please update" response instead of a cryptic error |
| 64 | Establish a migration policy for schema changes post-launch (every schema change ships as a new migration file, never edits an existing one — see SUPABASE_WORKFLOW.md) | `docs: document post-launch migration policy` | Review policy doc for completeness — this is a process commit, not a code one |
| 65 | Add a `CHANGELOG.md` and commit to updating it with every user-facing change | `docs: add changelog` | Confirm changelog entries map to actual shipped versions |

**Phase 9 checkpoint test:** Simulate a real update cycle — ship a small fake breaking change to the MCP protocol, confirm an old CLI gets a clear, actionable error rather than silently misbehaving.

---

## Phase 10 — Enterprise/Team Admin Readiness (Week 8, scope carefully)

Important distinction: **full enterprise features (SSO, self-hosting, formal audit exports) are explicitly out of scope for v1** per ROADMAP.md's non-goals — don't build these speculatively before there's a paying team customer asking for them. What *does* belong in v1 is making the Team tier feel administratively solid, not enterprise-complete. That's the line this phase draws.

| # | Task | Commit message example | How to test |
|---|---|---|---|
| 66 | Team settings page (rename project, transfer ownership) | `feat(dashboard): add team settings page` | Transfer ownership to a second test account, confirm old owner's permissions correctly downgrade to member |
| 67 | Bulk member invite (paste multiple emails at once) | `feat(dashboard): support bulk invites` | Invite 3 test emails at once, confirm all receive invites correctly |
| 68 | Basic usage/seat count display (for Team billing accuracy) | `feat(dashboard): display seat usage` | Add/remove members, confirm displayed count updates and matches what Stripe would actually bill for |
| 69 | Exportable audit log (simple CSV/JSON export of the audit entries from Phase 7) | `feat(dashboard): add audit log export` | Export, open the file, confirm entries match what actually happened |
| 70 | Document what's explicitly deferred to a future "Enterprise" tier (SSO, self-hosting, formal compliance exports) so it's a conscious choice, not an oversight | `docs: document enterprise tier deferral` | Review against ROADMAP.md non-goals for consistency |

**Phase 10 checkpoint test:** Have someone role-play as a team lead evaluating whether to pay for the Team tier — can they see who has access, control it, and trust that billing matches actual usage, without needing anything you've deliberately deferred? If yes, Team tier is ready; if they immediately ask for SSO or self-hosting, that's real signal to revisit the deferral, not a gap to panic-fill.

---

## General Testing Approach (apply throughout, not just at checkpoints)

**Unit tests** (Vitest recommended, fast and works well in a Vite-based monorepo)
- Cover: type validation, individual MCP tool logic in isolation (mock the Supabase calls), CLI command argument parsing
- Run before every commit that touches logic, not just at the end of a phase

**Integration tests**
- Cover: CLI → Supabase round trips, MCP tool → Supabase round trips, webhook → Supabase → bot commit chain
- These need a real (test/staging) Supabase project — don't run integration tests against a shared production database

**Manual agent testing (can't be fully automated, budget real time for this)**
- After every MCP tool change, manually open a real Claude Code (and later Cursor) session and actually use it — automated tests can confirm the server responds correctly, but only a real agent session confirms the *experience* feels seamless
- Keep a running checklist of manual scenarios (e.g. "fresh project, no history," "mid-task tool switch," "teammate without CLI installed") and re-run all of them after any MCP or GitHub integration change

**Security-specific testing**
- RLS policies: always test with at least two different user accounts, confirm cross-project data leakage is impossible
- Token scope: confirm a leaked project token can't access other projects
- Webhook signature verification: confirm bad signatures are always rejected

**Commit hygiene tip for hitting your 200-commit target naturally**
- Commit at the boundary of *any* working, testable unit — not just at the end of a feature. A single CLI command, a single MCP tool, a single dashboard view, a single bug fix, a single doc update are each their own commit
- This isn't padding — small commits make it much easier to `git bisect` if something breaks later, and they naturally produce a commit history that documents the build in Contextly's own spirit (ironic, but fitting)
