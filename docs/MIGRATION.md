# Migration Strategy: Old Prototype → New Protocol Architecture

**Date: July 2026**

---

## Analysis: Everything vs. The New Architecture

The old prototype was built on a fundamentally different model:

| Dimension | Old Prototype | New Protocol |
|-----------|---------------|--------------|
| Storage | Supabase (Postgres) | Local SQLite + JSON Lines |
| Identity | UUIDs | SHA256 content addressing |
| Primitive | "Decisions" + "Changes" | Entries (decision/rule/observation) |
| Retrieval | Vector search (pgvector, cosine similarity) | Deterministic DAG traversal |
| Sync | Server-based, always online | Local-first, offline-capable |
| Auth | GitHub OAuth, Supabase RLS | No auth (MVP) / workspace tokens (later) |
| UI | Full Next.js dashboard | No UI (MCP is the interface) |
| CLI | 7 commands, git analysis, Supabase sync | 3 commands: init, write, read |
| API | REST + MCP (both hitting Supabase) | MCP only (hitting local SQLite) |

The gap is wide enough that a gradual migration makes no sense. The old and new architectures don't share a data model, storage engine, identity system, or API surface.

---

## Keep

| File / Directory | Why |
|-----------------|-----|
| `docs/PROTOCOL.md` | **The new architecture.** This is the source of truth. |
| `docs/ARCHITECTURE.md` | System design for the new architecture. Complete and correct. |
| `docs/MVP.md` | Build plan. Drives the first 90 days. |
| `CLAUDE.md` | Needs minor edits (update reading order, remove old refs) but the pattern is right. |
| `.gitignore` | Already correct. Covers node_modules, .env, dist, .next, .contextly/. |
| `.github/workflows/daily-pulse.yml` | Operational heartbeat. Independent of application architecture. |
| `.github/activity/` | Log files for the daily pulse. |
| `ROOT package.json` | Workspace config, npm scripts (build, test, typecheck). Will need script updates. |
| `tsconfig.json` (root) | Base TypeScript config. May need target update (ES2022 vs CommonJS). |
| `LICENSE` | Apache 2.0. Correct. |

**Total kept: ~10 files out of ~120.**

---

## Modify

| File | Change | Why |
|------|--------|-----|
| `CLAUDE.md` | Remove references to `API_CONTRACTS.md`, `DATA_MODEL.md`, old docs. Add `PROTOCOL.md` as first read. | CLARIFICATION.md references docs that will be deleted. |
| `README.md` | Complete rewrite. Frame around the protocol, not the product. Quick start: `contextly init` → `contextly write` → MCP config. Remove deployment instructions, architecture diagrams of old system. | The old README describes a product that no longer exists. |
| `package.json` (root) | Update workspace paths. Remove dashboard from workspaces. Update scripts: remove deploy, add `build:protocol`, `build:cli`, `build:mcp`. | New package structure. |
| `tsconfig.json` (root) | Set `module: "ES2022"`, `target: "ES2022"`, `moduleResolution: "bundler"`. | The old config targets CommonJS. New packages should use ESM. |

**Total modified: 4 files.**

---

## Delete

| File / Directory | Why |
|-----------------|-----|
| `packages/dashboard/` (entire directory, ~35 files) | No UI in MVP. The dashboard was a Next.js app with auth, billing, landing pages. None of this exists in the new architecture. Dashboard comes after the thesis is proven. |
| `packages/shared/` (entire directory, 23 source files) | Every file in shared was built for the old architecture: Supabase client, old MCP schemas, old domain types (Decision, Change, Project, ProjectMember), old validator schemas, old utility functions. Not one file maps cleanly to the new protocol. Replaced by `packages/protocol/`. |
| `supabase/` (entire directory, 14 migrations) | The new architecture is local-first SQLite. Supabase is not in the MVP. 14 migrations with overlapping tables, conflicting schemas, and features (pgvector, Stripe, GitHub webhooks, audit logs, rate limiting) that don't exist in the new model. Start fresh. |
| `scripts/*.py` (10 Python files) | Security audit, penetration testing, benchmark analysis, design analysis — all for the old Supabase-based architecture. The new architecture has no server to pentest, no Supabase to audit, no dashboard to analyze. |
| `DEPLOYMENT.md` | References dashboard deployment (Vercel), Supabase (migrations). Irrelevant to local-first MVP. |
| `vercel.json` | Dashboard deployment config. Delete with the dashboard. |
| `packages/dashboard/next.config.ts` | Dashboard config. Deleted with dashboard. |
| `packages/dashboard/postcss.config.mjs` | Dashboard config. Deleted with dashboard. |
| `packages/dashboard/tailwind.config.ts` | Dashboard config. Deleted with dashboard. |
| `packages/dashboard/eslint.config.mjs` | Dashboard config. Deleted with dashboard. |
| `PROGRESS.md` | Tracked progress of the old prototype implementation. No longer relevant. |
| `CHANGELOG.md` | Release history of the old prototype. No longer relevant. |
| `SECURITY.md` | Security policy for the old prototype. No longer relevant. |
| `.env.example` | Old env vars (Supabase URL, Stripe keys, Resend API key, GitHub client ID). None exist in the new architecture. |
| `docs/API_CONTRACTS.md` | Defines old MCP tools (get_context, explain_file, recent_changes, log_decision, get_project_brief). These tools no longer exist. |
| `docs/DATA_MODEL.md` | Documents old Supabase schema (projects, decisions, changes, agent_sessions, etc.). Irrelevant. |
| `docs/AUTH.md` | GitHub OAuth, Supabase RLS, token auth. No auth in MVP. |
| `docs/GITHUB_INTEGRATION.md` | GitHub webhooks, app installation, bot commits. None exist in new architecture. |
| `docs/SECURITY_WHITEPAPER.md` | Security model for old architecture. The new protocol has a completely different security model (see ARCHITECTURE.md section 6). |
| `docs/SUPABASE_WORKFLOW.md` | Migration workflow. Irrelevant — no Supabase in MVP. |
| `docs/ENVIRONMENT_SETUP.md` | Environment variable setup for old architecture. Irrelevant. |
| `docs/MILESTONES_AND_TESTING.md` | Testing strategy for old features. Irrelevant. |
| `docs/COLLABORATION_AND_STORAGE.md` | Multi-user model for old architecture. Irrelevant (MVP is single-user). |
| `docs/ANALYZER_DEEP_DIVE.md` | Deep dive into git diff analyzer. Irrelevant — no git analysis in new protocol. |
| `docs/CONTRIBUTING.md` | Contribution guide for old architecture. MVP is pre-contribution. |
| `docs/TROUBLESHOOTING.md` | Common issues for old architecture. Irrelevant. |
| `docs/MCP_AGENT_INTEGRATION.md` | Agent setup for old MCP tools. Irrelevant. |
| `docs/LANDING_PAGE.md` | Landing page content for old dashboard. Irrelevant. |
| `docs/LANDING_PAGE_PROMPTS.md` | Prompts for landing page generation. Irrelevant. |
| `docs/OPERATIONS_AND_LAUNCH_READINESS.md` | Launch checklist for old architecture. Irrelevant. |
| `docs/ROADMAP.md` | Roadmap for old product. Superseded by MVP.md. |
| `docs/README.md` | Old docs index. Delete — PROTOCOL.md is now the entry point. |

**Total deleted: ~85 files.**

---

## Rewrite

### `packages/protocol/` (replaces `packages/shared/`)

**Old**: 23 files, Supabase client, old types, old schemas, old utilities.
**New**: 3 files, ~300 lines total.

**Inventory for rewrite:**

| File | What It Should Contain | Why Not Keep Old Version |
|------|----------------------|------------------------|
| `src/types.ts` | `ContextEntry`, `Conflict`, `MergeResult`, `Scope` | Old types.ts has `Project`, `Decision`, `Change`, `User`, old MCP shapes. None survive. The new entry type has content-addressed `id`, `cid`, `message`, `kind`, `scope`, `author`, `timestamp`, `parents`, `supersedes`, `status`. Completely different. |
| `src/store.ts` | JSON Lines append-only log reader/writer. Methods: `append(entry)`, `readByScope()`, `readByCid()`, `readById()`, `history()`. | Doesn't exist in old code. Old code reads/writes Supabase. This is a local file-based store. |
| `src/compiler.ts` | 5-pass Context Compiler: scope filter → status filter → cid dedup → inheritance → ordering. | Doesn't exist in old code. Old code does SQL queries against Postgres. The compiler is the core intellectual property of the new protocol. |
| `src/index.ts` | Barrel export: `export { ContextEntry, ... } from './types'` | Old barrel exports everything from 20+ modules. New barrel exports from 3 modules. |
| `package.json` | `name: "@contextly/protocol"`, `type: "module"`, `dependencies: {}`, `devDependencies: { typescript, vitest }` | New package. Old shared was `@contextly/shared`. |
| `tsconfig.json` | ESM config, target ES2022. | Different config from old shared (which was CommonJS). |

### `packages/cli/` (rewrite in place)

**Old**: 7 source files, 450-line entry point, git analysis, auth, Supabase sync.
**New**: 3 source files, ~200 lines total.

| File | What It Should Contain | Why Not Keep Old Version |
|------|----------------------|------------------------|
| `src/index.ts` | Entry point. Three commands: `init`, `write`, `read`. Import from `@contextly/protocol`. | Old entry point has 7 commands: login, logout, whoami, init, sync, log, status. Only `init` survives, and it does something completely different (creates `.contextly/` directory vs inserting into Supabase). |
| `src/init.ts` | Creates `.contextly/` directory with empty `log.jsonl` and `scope` config file. | Old init creates `.contextly/config.json` and `.contextly/mcp.json` and inserts project into Supabase. Completely different. |
| `src/write.ts` | Validates args, creates entry, passes to protocol store. | Old `log` command inserts a "decision" into Supabase with `source: 'manual'`. Doesn't use content addressing, cids, kinds, or the protocol at all. |
| `src/read.ts` | Calls `read()` on protocol store, displays active set as formatted text. | Doesn't exist in old code. Old code has `status` command that queries `project_stats` view. |
| `package.json` | Remove `@supabase/supabase-js`, `dotenv`, `cli-progress`, `terminal-table`, `ora`, `chalk` dependencies. Add `@contextly/protocol` dependency. | Old package.json has 11 runtime dependencies. New CLI needs only `commander` + the protocol package. |
| `tsconfig.json` | ESM config. | Old config is CommonJS. |

**Dependency reduction:** 11 runtime dependencies → 2 (`commander`, `@contextly/protocol`).

### `packages/mcp-server/` (rewrite in place)

**Old**: 416-line server with 5 tools querying Supabase.
**New**: ~200-line server with 2 tools backed by local protocol store.

| File | What It Should Contain | Why Not Keep Old Version |
|------|----------------------|------------------------|
| `src/index.ts` | MCP server with 2 tools: `read(scope, kind?, cid?)` and `write(cid, message, kind, scope)`. Backed by `@contextly/protocol` store. | Old server has 5 tools: `get_context` (vector search), `explain_file` (file → decisions mapping), `recent_changes` (time-windowed query), `log_decision` (insert), `get_project_brief` (stats query). All query Supabase. None survive. |
| `package.json` | Remove `@supabase/supabase-js`. Keep `@modelcontextprotocol/sdk`. Add `@contextly/protocol`. | Old server depends on Supabase. New server depends on local protocol. |
| `tsconfig.json` | ESM config. | Old config is CommonJS. |

**MCP tools: 5 → 2.** Dependencies: 4 → 2.

---

## Archive

These files contain valuable learnings but don't belong in the new repo. The git history preserves them.

| File | Why Valuable | Why Not Keep |
|------|-------------|-------------|
| `packages/dashboard/src/lib/security.ts` | Input sanitization, rate limiting patterns. Useful when we build the cloud relay. | The implementation targets Supabase RLS and REST endpoints. The new architecture needs different security model (workspace-scoped tokens, no global auth). |
| `packages/mcp-server/src/index.ts` (old) | Shows how to structure an MCP server with @modelcontextprotocol/sdk. Request timeouts, error handling patterns. | The tools, data access, and auth model are all wrong for the new protocol. |
| `packages/cli/src/auth.ts` | GitHub Device Flow OAuth implementation. Well-structured. | No auth in MVP. The pattern may be relevant when we add workspace tokens in week 9. |
| `packages/shared/src/errors.ts` | Custom error class hierarchy. Good pattern. | The old error types (AuthError, ProjectNotFoundError) don't exist in the new architecture. New errors will be ConflictError, ValidationError, NotFoundError. |
| `supabase/migrations/` (collectively) | Shows the evolution of a schema with RLS, triggers, functions, and performance tuning. Ideas for the eventual cloud relay schema. | The schema itself is worthless — it models the old data (projects, decisions, changes). The patterns (indexing, RLS, triggers) are keepers. |
| `scripts/security_audit.py` | Security audit patterns. | Audits Supabase RLS policies and REST endpoints. None of these exist in the new architecture. |

These files stay in git history. No need to physically move them.

---

## New Monorepo Architecture

```
contextly/
├── packages/
│   ├── protocol/           # @contextly/protocol
│   │   ├── src/
│   │   │   ├── types.ts       # ContextEntry, Conflict, MergeResult
│   │   │   ├── store.ts       # JSON Lines append-only log
│   │   │   ├── compiler.ts    # 5-pass Context Compiler
│   │   │   └── index.ts       # barrel
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                # @contextly/cli
│   │   ├── src/
│   │   │   ├── index.ts       # commander entry, 3 commands
│   │   │   ├── init.ts        # .contextly/ directory creation
│   │   │   ├── write.ts       # write entry protocol wrapper
│   │   │   └── read.ts        # read active set display
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mcp-server/         # @contextly/mcp-server
│       ├── src/
│       │   └── index.ts       # MCP stdio server, read + write tools
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── PROTOCOL.md          # (keep)
│   ├── ARCHITECTURE.md      # (keep)
│   └── MVP.md               # (keep)
│
├── .github/
│   └── workflows/
│       └── daily-pulse.yml  # (keep)
│
├── CLAUDE.md                # (modify)
├── README.md                # (rewrite)
├── package.json             # (modify — update workspaces + scripts)
├── tsconfig.json            # (modify — ESM config)
├── .gitignore               # (keep)
├── LICENSE                  # (keep)
└── SECURITY.md              # (new — protocol-specific, not old prototype)
```

### Package Boundaries

| Package | Responsibility | Does NOT Do |
|---------|---------------|-------------|
| `@contextly/protocol` | Types, storage, compiler. Core protocol logic. | No CLI, no MCP, no network, no UI, no Supabase. |
| `@contextly/cli` | Human interface via terminal. Wraps protocol. | No MCP, no network, no Supabase, no daemon. |
| `@contextly/mcp-server` | Agent interface via MCP. Wraps protocol. | No human UI, no network (stdio only), no Supabase, no REST. |

**Dependency graph:**
```
    @contextly/cli
         │
         ▼
  @contextly/protocol
         ▲
         │
  @contextly/mcp-server
```

No circular dependencies. No dependencies on external services. The protocol package depends on nothing (zero npm dependencies).

---

## New Database Model

### Old (Supabase, 14 tables)

```
profiles, projects, project_members, decisions, changes,
agent_sessions, waitlist, subscriptions, audit_logs,
embeddings (pgvector), github_installations, usage_quotas,
rate_limits (×2), project_stats
```

### New (Local SQLite, 1 table)

```sql
CREATE TABLE entries (
    id          TEXT PRIMARY KEY,          -- sha256:hex
    cid         TEXT NOT NULL,             -- dotted path
    message     TEXT NOT NULL,             -- the memory
    kind        TEXT NOT NULL CHECK(kind IN ('decision','rule','observation')),
    scope       TEXT NOT NULL,
    author      TEXT NOT NULL,
    timestamp   TEXT NOT NULL,             -- ISO 8601
    parents     TEXT DEFAULT '[]',         -- JSON array
    supersedes  TEXT,                      -- nullable id ref
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK(status IN ('active','superseded','archived','tombstoned'))
);

CREATE INDEX idx_active    ON entries(scope, cid, timestamp DESC) WHERE status = 'active';
CREATE INDEX idx_history   ON entries(scope, cid, timestamp DESC);
CREATE INDEX idx_supersedes ON entries(supersedes) WHERE supersedes IS NOT NULL;
```

**14 tables → 1 table. No SQLite initially — JSON Lines file is the MVP storage. SQLite comes when performance demands it.**

---

## New MCP Architecture

### Old (5 tools, Supabase-backed)

```
get_context(query)        → vector search decisions
explain_file(path)        → file → decision mapping
recent_changes(since)     → time-windowed query
log_decision(entry)       → insert into Supabase
get_project_brief()       → stats query
```

### New (2 tools, local protocol-backed)

```
read(scope, kind?, cid?)  → active entries from local log
write(cid, message, kind, scope) → append to local log
```

Transport: stdio only. No HTTP. No authentication. The MCP server finds the `.contextly/` directory by walking up from CWD.

---

## New CLI Architecture

### Old (7 commands, Supabase-backed)

```
login       → GitHub OAuth device flow
logout      → clear session
whoami      → show current user
init        → create project in Supabase
sync        → git diff analysis → Supabase
log         → manual decision → Supabase
status      → query project_stats from Supabase
```

### New (3 commands, local protocol-backed)

```
init        → create .contextly/ with empty log.jsonl
write       → append entry to log.jsonl
read        → compile and display active set
```

No auth. No git analysis. No network calls. Everything is a local file operation.

---

## Migration Timeline

### Week 1: Clean + Core Protocol

| Day | Task | Files Changed |
|-----|------|--------------|
| 1 | Delete dashboard, shared, supabase, scripts, old docs | ~85 files deleted |
| 2 | Rewrite `packages/protocol/` — types, store, compiler | 4 new files, ~300 lines |
| 3 | Rewrite `packages/protocol/` — tests for store + compiler | 1 test file |
| 4 | Update root configs — package.json, tsconfig.json, CLAUDE.md | 3 files modified |
| 5 | End-to-end test: init → write entries → compiler produces active set | Manual verification |

**Deliverable**: `@contextly/protocol` published to npm (or locally linked). A `.contextly/` directory with entries can be compiled to an active set.

### Week 2: CLI + MCP

| Day | Task | Files Changed |
|-----|------|--------------|
| 6 | Rewrite CLI — init, write, read commands | 4 files, ~200 lines |
| 7 | Test CLI — init creates dir, write appends, read compiles | Manual E2E |
| 8 | Rewrite MCP server — read + write tools | 1 file, ~200 lines |
| 9 | Test MCP — connect with Claude Code sandbox, verify read/write | Manual E2E |
| 10 | Integration test — full loop: init → seed 5 entries → MCP read → MCP write → read | Manual E2E |

**Deliverable**: Working local-first Contextly. A developer can init, write context, and have their AI agent read and write context.

### Week 3: Dogfood + Polish

| Day | Task | Files Changed |
|-----|------|--------------|
| 11 | Dogfood on Contextly repo itself. Seed 10 constraints. | Bug fixes |
| 12 | Fix top 3 bugs from dogfooding | Protocol/cli/mcp fixes |
| 13 | Write `README.md` — protocol-first framing, quick start | 1 file |
| 14 | Write `SECURITY.md` — protocol-specific security model | 1 file |
| 15 | Final polish, tag v0.1.0-alpha | Config files |

**Deliverable**: Stable local-first MVP ready for external testing.

### Week 4: Open Source Release

| Day | Task | Files Changed |
|-----|------|--------------|
| 16 | Publish packages to npm (`@contextly/protocol`, `@contextly/cli`, `@contextly/mcp-server`) | npm publish |
| 17 | Blog post: "Your AI Agent Needs a Memory" | New blog |
| 18 | Post to HN, /r/MachineLearning, /r/ClaudeCode | Social |
| 19 | Respond to issues, fix onboarding friction | Bug fixes |
| 20 | End of week 4 — assess retention | Metrics review |

**Deliverable**: Open source release with real users.

---

## Migration Commands Summary

To execute the migration:

```bash
# Phase 1: Delete old architecture
rm -rf packages/dashboard
rm -rf packages/shared
rm -rf supabase/
rm -rf scripts/*.py
rm -f DEPLOYMENT.md PROGRESS.md CHANGELOG.md SECURITY.md .env.example
rm -f docs/API_CONTRACTS.md docs/DATA_MODEL.md docs/AUTH.md docs/GITHUB_INTEGRATION.md
rm -f docs/SECURITY_WHITEPAPER.md docs/SUPABASE_WORKFLOW.md docs/ENVIRONMENT_SETUP.md
rm -f docs/MILESTONES_AND_TESTING.md docs/COLLABORATION_AND_STORAGE.md docs/ANALYZER_DEEP_DIVE.md
rm -f docs/CONTRIBUTING.md docs/TROUBLESHOOTING.md docs/MCP_AGENT_INTEGRATION.md
rm -f docs/LANDING_PAGE.md docs/LANDING_PAGE_PROMPTS.md docs/OPERATIONS_AND_LAUNCH_READINESS.md
rm -f docs/ROADMAP.md docs/README.md
rm -f packages/dashboard/next.config.ts packages/dashboard/vercel.json
rm -f packages/dashboard/postcss.config.mjs packages/dashboard/eslint.config.mjs

# Phase 2: Create new protocol package
mkdir -p packages/protocol/src
# (write files manually — see specification above)

# Phase 3: Rewrite CLI
# (edit packages/cli/src/* in place)

# Phase 4: Rewrite MCP server
# (edit packages/mcp-server/src/* in place)

# Phase 5: Update root configs
# (edit package.json, tsconfig.json, CLAUDE.md, README.md)
```

---

## Summary Statistics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Packages** | 4 (shared, cli, mcp-server, dashboard) | 3 (protocol, cli, mcp-server) | -1 |
| **Source files** | ~70 | ~10 | -85% |
| **Lines of TypeScript** | ~2,700 | ~700 | -74% |
| **npm dependencies** | ~40 runtime deps | ~5 runtime deps | -87% |
| **Database tables** | 14 (Postgres) | 1 (SQLite, optional) | -93% |
| **MCP tools** | 5 | 2 | -60% |
| **CLI commands** | 7 | 3 | -57% |
| **Docs** | 21 files | 3 files | -86% |
| **Python scripts** | 10 | 0 | -100% |
| **Total files** | ~120 | ~25 | -79% |

---

## What Contains Valuable Learnings (Don't Delete Without Reviewing)

These files have patterns worth preserving in some form:

1. **`packages/mcp-server/src/index.ts`** — The MCP server setup pattern (request timeouts, error handling, tool registration). The new MCP server uses the same `@modelcontextprotocol/sdk` but with different tools. Extract the setup pattern, discard the tools.

2. **`packages/cli/src/auth.ts`** — GitHub Device Flow OAuth. Not needed in MVP but may be relevant when the cloud relay ships (week 9-10). The pattern for local token storage and OAuth callback handling is well-designed.

3. **`packages/shared/src/errors.ts`** — Custom error class hierarchy. The pattern (extending Error, typed error codes) is good. New errors will be different but the pattern is transferable.

4. **`packages/dashboard/src/lib/security.ts`** — Rate limiting, input sanitization, security event logging. Useful when the cloud relay needs security. The implementation details are Supabase-specific but the concepts transfer.

5. **`supabase/migrations/20260710183000_add_security_rate_limits.sql`** — Sliding window rate limit implementation. Good pattern to reuse in the cloud relay.

Read these, extract the patterns, then delete them from the repo. The git history preserves the originals.