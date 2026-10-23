# Repository Rules (Session Memory)

These rules override any conflicting instructions elsewhere in the conversation.

## 1. Never work on main/master directly

- Before writing any code, check the current branch. If it's main/master, create a new branch first.
- Branch naming: `feature/<desc>`, `fix/<desc>`, `refactor/<desc>`, `docs/<desc>`, `chore/<desc>`, `spike/<desc>`
- Branch names are lowercase, hyphenated, no ticket numbers unless provided.

## 2. Commit discipline

- One logical change per commit. Never one giant commit at end of session.
- Never commit broken code to a shared branch.
- Format: Conventional Commits — `<type>(<scope>): <short summary>` with body explaining why.
- Types: feat, fix, refactor, docs, test, chore, perf, ci
- Scopes: storage, compiler, mcp, sync, sdk, cli, dashboard, infra, docs
- No messages like "fix stuff", "wip", "updates", "asdf".
- Never rewrite history on a pushed/shared branch unless asked.

## 3. Pull requests, not direct merges

- Open a PR from feature branch into main when work is complete.
- Every PR includes: what changed and why, how tested, breaking changes/migration steps, screenshots for dashboard.
- Do not merge own PR unless explicitly told to auto-merge.

## 4. Repository hygiene

- README.md must always be current (what, quick start, how to run, how to test, link to docs).
- .gitignore must be correct for the stack.
- No secrets, API keys, tokens, or .env files ever committed. Example config goes in `.env.example`.
- Every new package/service gets its own README.
- Consistent formatting/linting enforced via CI — set it up before writing more code.
- No dead code, commented-out blocks, or debug console.logs in commits headed for main.
- Folder structure should be self-explanatory.

## 5. CI enforcement

- Every PR must pass: build, lint, and relevant test suite.
- Never disable a failing test to make CI green.

## 6. Traceability

- Every commit/PR implementing a numbered prompt (Prompts 1–19) should reference which prompt/phase in the commit body or PR description.

## 7. When in doubt

- Default to smaller, more atomic commits.
- Never push directly to main — flag it first even for "trivial" changes.