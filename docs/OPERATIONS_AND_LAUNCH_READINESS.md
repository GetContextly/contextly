# Operations & Launch Readiness

Direct answer to "is X covered?" plus everything else needed before this can responsibly take paying customers. Existing docs cover product mechanics well; this doc covers what keeps it *running* once real people and real money are involved.

---

## Your Direct Questions

### Database costs
**Not previously covered — here's what needs deciding:**
- Supabase's free tier caps storage, database size, and monthly active users — know these limits and which one you'll hit first as usage grows
- Set up **billing alerts** in Supabase's dashboard before launch, not after a surprise invoice
- Decide who absorbs cost risk early on: if Free-tier users store unlimited local project data, does that data also sit in Supabase indefinitely? Consider a retention policy for `changes` (routine, high-volume) vs `decisions` (low-volume, keep indefinitely) — this was actually hinted at in DATA_MODEL.md's note on different retention needs, but never made concrete. Make it concrete: e.g. auto-prune `changes` older than 90 days for Free tier, keep indefinitely for Pro.

### Subscription plan expiration
**Partially covered in Phase 8 (billing), needs more precision:**
- Decide and document: does downgrade happen instantly on cancellation, or at the end of the current billing period? (Standard practice: end of period — customer already paid for it)
- Handle **failed renewal payments** with a grace period (e.g. 3-7 days of continued access + email reminders) before hard downgrade — avoids punishing someone over an expired card
- Decide what happens to *data* on downgrade — does a downgraded team lose access to projects beyond what Free allows, or just lose the ability to add new ones? Pick the less punishing option; it's better for trust and for word-of-mouth

### Customer support
**Not previously covered. For a solo-built product, keep this realistic, not enterprise-scale:**
- A single support email (e.g. `support@getcontextly.dev`) is enough for v1 — don't over-build a ticketing system before you have volume
- Set expectations publicly (e.g. "we reply within 24-48 hours") so silence doesn't feel like abandonment
- Keep a simple internal log (even a spreadsheet) of support requests and their resolutions — this becomes your future FAQ and product docs content, essentially free
- Plan for the inevitable: billing disputes, "my agent isn't picking up context," "I can't log in." Have a short internal runbook for each before you need it live

### Product docs
**Not previously covered — distinct from your internal build docs, this is public-facing:**
- Needs its own site or section (can start as a `docs/` folder rendered via something like Docusaurus, Mintlify, or even just well-organized markdown on GitHub for v1 — doesn't need to be fancy at launch)
- Minimum viable docs set: Getting Started (`init` walkthrough), CLI command reference, MCP tool reference (for people curious what's under the hood), FAQ, troubleshooting common errors
- This can mostly be adapted from your existing internal docs (ARCHITECTURE.md, MCP_AGENT_INTEGRATION.md) — rewritten in a friendlier, less internal-planning tone

---

## Things Not Yet Mentioned That Should Be

### Legal essentials (genuinely can't skip these once you take payment or personal data)
- **Terms of Service** — even a solid template adapted to your product is far better than nothing
- **Privacy Policy** — required by Stripe, by GitHub OAuth's terms, and by basic decency given you're storing project data
- **Data Processing Agreement (DPA)** — only urgent once a business customer asks for one (common for Team tier); fine to prepare reactively rather than day one

### Monitoring & observability
- Error tracking (e.g. Sentry) on the MCP server and dashboard — you want to know when something breaks before a user has to tell you
- Uptime monitoring on the MCP server specifically — if it's down, every connected agent silently fails, which is a uniquely bad failure mode for this product
- Basic logging/alerting on webhook failures (a GitHub event that fails to process should not fail silently)

### Backups & disaster recovery
- Supabase provides automated backups on paid tiers — confirm what tier you're on and what the actual recovery process looks like, don't assume
- Decide: if Supabase had an outage or data loss, is the git-committed `.contextly/context.json` mirror sufficient to reconstruct state? (This is actually a nice side-benefit of the hybrid storage model worth being deliberate about)

### Abuse & rate limiting
- Beyond the auth-endpoint rate limiting already planned — consider what stops someone from spinning up unlimited free-tier projects to bypass the "1 project" cap (e.g. one email = one account enforcement, basic fraud signals)

### Data deletion / account closure
- A clear path for a user to delete their account and data entirely — required for basic GDPR-style compliance and just good practice, independent of whether you're targeting EU users specifically

### Analytics (product, not personal)
- Basic usage analytics (which CLI commands get used, where users drop off in `init`) — helps you know what to fix first post-launch, distinct from the waitlist signup analytics mentioned earlier

### Marketing/launch site basics
- SEO meta tags, Open Graph image (so the link looks right when shared on Twitter/LinkedIn) for the landing page — easy to forget, embarrassing to launch without
- A status page (even a free one like a simple statuspage.io alternative) so "is Contextly down or is it just me" has a clear answer during any incident

### Security disclosure
- A simple `security@getcontextly.dev` or a note in the docs on how to responsibly report a vulnerability — cheap to set up, and prevents a well-meaning security researcher from just posting a vulnerability publicly because they had no other channel

---

## Suggested Priority for a Solo Builder

Not everything above needs to exist before launch. Rough priority:

**Must exist before taking any real payment:**
Terms of Service, Privacy Policy, support email, billing alert setup, basic error tracking

**Must exist before public launch (even free tier):**
Product docs (minimum viable set), data deletion path, OG tags/SEO basics

**Fine to build reactively, after initial traction:**
DPA, status page, formal audit log exports, advanced abuse detection, detailed usage analytics

**Explicitly fine to defer, matches earlier ROADMAP.md non-goals:**
SSO, self-hosting, enterprise compliance certifications
