# Roadmap

## V1 — Core Loop (Weeks 1-8)

The goal of v1 is to prove the single most important journey works end to end: **a dev sets up Contextly on one real project, and switching between two AI agents mid-task actually feels seamless.** Everything else is secondary until this works.

**Phase 1 (Weeks 1-2) — Foundation**
- Define shared types/schema (`decisions`, `changes`, `projects`)
- Supabase project set up with RLS policies from DATA_MODEL.md
- `contextly init` — repo scan, starter brief generation, MCP config written locally

**Phase 2 (Weeks 3-4) — The Core Loop**
- MCP server live with the four core tools: `get_context`, `explain_file`, `recent_changes`, `log_decision`
- Connect one agent (Claude Code) end to end
- GitHub webhook capture working for commits and merged PRs

**Phase 3 (Weeks 5-6) — Dashboard v1**
- Login (GitHub OAuth via Supabase Auth)
- Plain-English timeline view of decisions/changes for a project
- Basic billing scaffold (even if just a placeholder for Free/Pro tiers)

**Phase 4 (Weeks 7-8) — Second Agent + Polish**
- Connect Cursor as the second agent — this is what actually proves the "switching agents" pitch
- Fix rough edges from dogfooding on your own real projects
- Soft launch to a small group for feedback before wider release

---

## V2 — Once the Core Loop Is Validated

Only pursue these after real usage confirms the core loop is valuable — don't build them speculatively:

- **Drift detection** — flag when the stored brief contradicts what the code now does
- **Conflict detection** — warn when one agent's in-progress change contradicts another agent's recent decision
- **Token-budget-aware injection** — adjust how much context is returned based on the requesting agent's remaining context window
- **Cross-project pattern memory** — for freelancers/agencies juggling multiple client repos, learn personal conventions and flag drift across projects
- **Role-based onboarding briefs** — condensed briefs tailored to what a new session is about to touch

---

## Explicit Non-Goals for V1

Keeping these out of scope early avoids scope creep that delays the core loop:

- Full "conflict detection" between agents — hard to get right, not needed to prove the concept
- Live (non-batched) summarization — costs more, batched is good enough to start
- Support for every possible AI coding tool — one or two well-integrated agents beats five shallow ones
- Enterprise features (SSO, self-hosting, audit logs) — irrelevant until there's a team tier with real paying users
