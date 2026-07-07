# GitHub Integration

## Purpose

This is how Contextly captures decisions and changes **passively** — the core thing that separates it from a manually maintained doc. If a dev has to remember to update something, they won't. If it happens automatically off events they're already doing (commit, merge, PR), it actually stays current.

---

## Setup Flow

1. During GitHub OAuth login, request the `repo` scope (or narrower `contents:read` + `webhooks` if you want to be more conservative about permissions)
2. When a user runs `contextly init` inside a repo, the CLI (using the user's GitHub token) registers a webhook on that repo pointing at Contextly's webhook endpoint
3. From then on, GitHub pushes events to Contextly automatically — no polling needed

---

## Events to Listen For

| GitHub Event | What Contextly Does With It |
|---|---|
| `push` (commit) | Parses commit messages and diff summary; if a commit includes a flagged decision marker (see below), logs it as a decision. Otherwise logs it as a routine change. |
| `pull_request` (merged) | Treats merge as a stronger signal — summarizes the PR description + diff into a plain-English "what changed and why" entry |
| `pull_request_review` | Optional v2: capture reviewer pushback as additional context ("this approach was initially rejected because...") |

---

## Flagging a Decision Explicitly

Not every commit is a "decision" worth surfacing prominently. Give devs (and agents) a lightweight way to flag ones that matter:

```
git commit -m "Switch to Supabase over Firebase --context"
```

The `--context` flag (or a `[decision]` tag in the message — pick one convention and document it clearly) tells Contextly's webhook handler: *this one goes in the decision log, not just the routine change feed.*

Agents working via the MCP server can also call `log_decision()` directly mid-session, without needing a git commit at all — useful for reasoning that happens in conversation but doesn't map to a single commit.

---

## Processing a Webhook Payload

High-level steps (no code, just the sequence):

1. Verify the webhook signature using the stored secret (GitHub signs every payload — always verify before processing, to avoid spoofed events)
2. Identify which Contextly project the repo maps to
3. Extract relevant data: commit messages, files changed, PR title/description
4. Run it through the summarization step (batched, not live — see ARCHITECTURE.md's cost note) to produce a plain-English entry
5. Store the entry, tagged as either "decision" or "change," linked to the project

---

## Handling Large or Noisy Repos

- **Batch webhook processing** rather than reacting to every single push individually if a repo has high commit frequency — process in short intervals (e.g. every few minutes) to avoid redundant summarization calls
- **Ignore-list support** — let users exclude certain paths (e.g. `node_modules`, generated files, lockfiles) from triggering context updates at all
- **Squash-merge awareness** — if a team squashes PRs, prefer summarizing the PR description over replaying every individual commit that got squashed away

---

## Keeping the Local Mirror Fresh for Everyone (Even Without the CLI)

Two different writes happen in this system, and it matters what actually performs each one:

1. **Writing to Supabase** — happens via the webhook itself, server-side, regardless of who committed or whether they have the CLI installed
2. **Writing the local `.contextly/context.json` mirror back into the repo** — this needs an actual commit, since the file lives in git

For #2, Contextly uses a **GitHub App** (the same mechanism Dependabot uses) — not a personal "bot account." A GitHub App is installed on a repo with specific granted permissions (read/write contents, read metadata), authenticates via short-lived installation tokens rather than a permanent password/PAT, and commits show up clearly attributed as automated (e.g. `contextly[bot]`). This distinction matters: creating a fake personal account to automate commits would violate GitHub's Terms of Service, since machine accounts impersonating a person aren't permitted — a registered GitHub App is the correct, ToS-compliant way to do this.

This means:

- The committed context mirror stays current **even if zero team members have the CLI installed locally**
- Every teammate gets the same fresh, full context on pull, regardless of personal setup
- CLI installation becomes about unlocking *personal* capabilities — querying from your own terminal, connecting your own AI agent, flagging decisions from your machine — not a requirement for the shared context to exist or stay current
- App commits are automatically, clearly marked as bot-authored by GitHub itself (the `[bot]` suffix), so teams recognize them as automated the same way they already recognize Dependabot commits

Full team CLI adoption is still valuable — more decisions get explicitly flagged, more agents get connected — but it's an enhancement, never a hard requirement for the shared brief to work.

### Setup Note

The same GitHub App registered here should also be the one used for the OAuth login flow and webhook subscription described earlier in this doc — one App registration covers login, webhook delivery, and the automated commit-back, rather than juggling separate credentials for each.

---

## What This Enables Downstream

Once GitHub events are flowing in, both the MCP server and dashboard can answer:
- "What changed since I was last in this codebase?"
- "Why did we make this change?" (pulls the linked decision, not just the diff)
- Drift detection (v2): comparing what the stored brief says against what recent commits actually did
