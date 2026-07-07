# Troubleshooting

Common issues and fixes — during development now, and the seed of your public FAQ/support responses later.

---

## CLI Issues

**`contextly init` fails with a permissions error**
- Confirm you're logged in (`contextly login`) before running `init`
- Confirm your GitHub OAuth token has the required scope (`repo` or `contents:read` + `webhooks`) — a token created before a scope change won't retroactively gain it; re-run `login`

**`contextly sync` says "you're not a member of this project"**
- Confirm the project ID in `.contextly/config.json` matches an actual project you've been added to
- Ask a project Owner to run `contextly invite your@email.com`, or check the dashboard's member list directly

**Sync pulls nothing / seems stuck**
- Check `MCP_SERVER_PUBLIC_URL` and Supabase env vars are correctly set — a silent misconfiguration here looks like "nothing happens" rather than a clear error
- Confirm the local Supabase instance (if testing locally) is actually running: `supabase status`

---

## MCP Server / Agent Issues

**Agent (Claude Code/Cursor) doesn't seem to call Contextly's tools at all**
- Check the MCP config file (`.contextly/mcp.json`) is correctly referenced in the agent's own MCP settings — this is usually the actual cause, not a Contextly bug
- Confirm tool descriptions are clear enough that the agent's own reasoning decides to use them (vague tool descriptions mean agents just won't reach for them — see `MCP_AGENT_INTEGRATION.md`)

**Agent gets an auth/token error connecting**
- Project tokens can be rotated (intentionally or accidentally) — confirm the token in `.contextly/mcp.json` matches the current one in the dashboard; if rotated, re-run `contextly sync` or `contextly init` to refresh it

**`get_context` returns empty/unhelpful results on a real project**
- Confirm decisions have actually been logged for that project (check the dashboard timeline) — an empty result is often correct behavior on a project with little history yet, not a bug

---

## GitHub Integration Issues

**Webhook events aren't arriving**
- Check GitHub's webhook delivery log (repo Settings → Webhooks → click the webhook → Recent Deliveries) — this shows exactly what was sent and what response came back, the fastest way to diagnose this
- Confirm the webhook secret matches between GitHub's config and `GITHUB_WEBHOOK_SECRET` in your environment

**Bot commits aren't appearing**
- Confirm the bot account/app actually has write access to the repo (this is granted during the OAuth scope request at setup — a repo added after the fact might not have re-granted it)
- Check for merge conflicts if the bot's commit and a human's commit land on the same file at nearly the same time — decide and document a conflict resolution approach if this becomes a recurring issue

---

## Billing Issues

**User upgraded but still sees Free tier limits**
- Check the Stripe webhook (`checkout.session.completed`) actually fired and was processed — use Stripe's dashboard event log to confirm delivery and response
- Confirm tier enforcement logic reads from the same field the webhook handler updates — a mismatch here (updating one field, checking another) is a common source of this exact bug

**Downgrade happened immediately instead of at period end**
- Check the cancellation logic against the documented policy in `OPERATIONS_AND_LAUNCH_READINESS.md` — confirm the code actually implements "end of period" rather than reacting to the cancellation webhook instantly

---

## Dashboard Issues

**Logged-in user sees no projects / sees the wrong ones**
- This is very likely an RLS policy issue, not a frontend bug — check the actual Supabase query being run and test it directly against the database as that specific user
- Never "fix" this by loosening RLS policies as a shortcut — narrow the actual bug instead, since RLS is the real security boundary here

---

## General Debugging Approach

1. Reproduce with the least amount of setup possible (a fresh test project, a fresh test user) before assuming it's a deep bug
2. Check logs/error tracking (Sentry, once set up) before guessing
3. If it involves Supabase, test the exact query directly in the Supabase SQL editor or local Studio UI to isolate whether it's a database issue or an application-layer issue
4. If it involves an MCP tool, test it directly (via an MCP inspector tool or a scratch script) before assuming the agent itself is misbehaving
