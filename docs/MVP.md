# Contextly MVP Plan

**Proving: "Agents make better decisions when they inherit a persistent constraint graph."**

---

## 1. The Exact MVP User

**Solo developer using Claude Code or Cursor on a real project.**

Not an AI agent builder. Not an enterprise team. Not a platform company.

One developer. One project. One AI agent. The developer is tired of telling their agent the same things every session:
- "We use Supabase, not Firebase."
- "Prefer Drizzle over Prisma."
- "Tests go in `__tests__/` not `tests/`."

They want the agent to just *know* these things without being told again.

This user:
- Has used AI coding agents for at least 3 months
- Has felt the pain of repeating context
- Is technically capable enough to run `npx contextly init`
- Will try a tool that promises "your agent remembers your project"
- Does NOT need a team, permissions, or cloud sync
- Does NOT need a dashboard, UI, or analytics

---

## 2. The Single Killer Workflow

One loop. Four steps. Fifteen seconds.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. INIT                                                │
│     developer runs: contextly init                      │
│     → creates .contextly/ with an empty log             │
│                                                         │
│  2. SEED                                                │
│     developer writes 3-5 project constraints:           │
│     contextly write --cid tech.stack \                  │
│       --message "TypeScript, Next.js, Supabase"         │
│       --kind decision                                   │
│                                                         │
│  3. AGENT SESSION                                       │
│     developer opens Claude Code / Cursor                │
│     MCP server serves the active set as plain text      │
│     agent reads: "tech.stack: TypeScript, Next.js..."   │
│     agent makes decisions with context                  │
│     agent writes new entries:                           │
│       "api.routes: App Router with route handlers"      │
│                                                         │
│  4. CONTINUATION                                        │
│     next session, agent reads everything                │
│     including what it wrote last time                   │
│     developer never re-explains                         │
│                                                         │
│  ──────── REPEAT ────────→                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The entire loop is local. No server. No internet. No accounts. Just a `.contextly/` directory and an MCP server.

The value is proven the first time an agent references a constraint without being told.

---

## 3. MVP Primitives Only

### Must Exist

| Primitive | Why |
|-----------|-----|
| `write(cid, message, kind)` | So agents can record decisions |
| `read(scope, [kind], [cid])` | So agents can inherit decisions |
| Context Compiler | Transforms the log into the active set |
| MCP server (stdio) | So Claude Code / Cursor can connect |
| JSON Lines log file | The storage format — no database needed |
| SHA256 content addressing | So entries are immutable and deduplicatable |
| CLI (init, write, read) | So humans can seed and inspect context |
| `kind` filtering | So agents can ask for "just the rules" |

### Implementation

The entire MVP is **two files and a CLI**:

```
packages/
├── protocol/          # ~300 lines of TypeScript
│   ├── compiler.ts    # 5-pass compiler (scope → status → dedup → inherit → order)
│   ├── store.ts       # Append-only JSON Lines file reader/writer
│   └── types.ts       # ContextEntry and related types
│
└── mcp-server/        # ~200 lines of TypeScript
    └── index.ts       # MCP stdio server exposing read + write

cli/                   # ~200 lines of TypeScript (injected into protocol package)
    ├── init.ts        # Creates .contextly/ directory + log file
    ├── write.ts       # Writes an entry to the log
    └── read.ts        # Reads and displays the active set
```

Total: **~700 lines of TypeScript.**

### Must NOT Exist

| Feature | Rationale for Exclusion |
|---------|-------------------------|
| Cloud relay | No server. The MVP is 100% local. Prove the thesis first. |
| Authentication | No accounts, no tokens, no login. Just a local file. |
| Fork / merge | Single scope only. The user has one project. |
| Conflict resolution | Single user. No conflicts to resolve. Last writer wins. |
| History traversal | Not needed to prove the thesis. Add later. |
| Tombstoning | Not needed. User can delete the file. |
| Archival | Not needed for 90 days. |
| SDK (Python, Go) | TypeScript only. The MCP server handles other languages. |
| REST API | MCP covers the API surface. No HTTP needed. |
| Dashboard | No UI. The agent's output is the interface. |
| Sync engine | No cloud. No sync. |
| Vector search | Not in the protocol. Not needed. |
| Multiple scopes | One scope = one project. Prove it works before generalizing. |
| Tests | At MVP velocity, tests slow us down. We test by dogfooding. |
| Documentation beyond README | The MCP config is one JSON block. The CLI is 3 commands. |

---

## 4. First 90 Day Roadmap

### Week 1: Core Protocol

- [x] Define `ContextEntry` type (id, cid, message, kind, scope, author, timestamp, parents, supersedes, status)
- [x] Implement JSON Lines store: append entry, read by id, read by (scope, cid)
- [x] Implement SHA256 content addressing
- [x] Implement Context Compiler: filter active, group by cid, latest wins
- [x] Ship as `@contextly/protocol` (npm package, ~300 lines)

### Week 2: MCP Server

- [ ] Implement `read(scope, kind?, cid?)` MCP tool
- [ ] Implement `write(cid, message, kind)` MCP tool
- [ ] Wire up MCP server to the protocol store
- [ ] Test: connect Claude Code to the MCP server, verify it can read/write
- [ ] Ship as `@contextly/mcp-server` (~200 lines)

### Week 3: CLI

- [ ] `contextly init` — creates `.contextly/` with empty log + scope config
- [ ] `contextly write --cid X --message Y --kind Z` — appends to log
- [ ] `contextly read` — displays active set
- [ ] Ship as `@contextly/cli` (~200 lines, wraps protocol package)

### Week 4: Dogfood — Real Project

- [ ] Use Contextly with Claude Code on the Contextly repo itself
- [ ] Seed 10 constraints about the project
- [ ] Run 5 agent sessions, observe whether constraints are inherited
- [ ] Fix bugs found during dogfooding
- [ ] Measure: does the agent reference context without prompting?

### Week 5: Dogfood — External Project

- [ ] Find 1-2 developer friends willing to try it
- [ ] Give them the npm package + 5-minute setup guide
- [ ] Observe silently — do they understand the workflow?
- [ ] Fix onboarding friction
- [ ] Measure: do they use it more than once?

### Week 6: Polish

- [ ] Better CLI output (colors, formatting)
- [ ] Error messages that don't suck
- [ ] The MCP config snippet works on first try
- [ ] Write a proper README with the quick start

### Week 7: Open Source Release

- [ ] Publish to npm: `@contextly/protocol`, `@contextly/mcp-server`, `@contextly/cli`
- [ ] Open source the repo (Apache 2.0)
- [ ] Post on Hacker News, /r/MachineLearning, /r/ClaudeAI
- [ ] Write a blog post: "Your AI Agent Needs a Memory"

### Week 8: Community Feedback

- [ ] Collect issues from early users
- [ ] Fix the top 3 pain points
- [ ] Identify the most common use case

### Week 9: First Paid Feature — Cloud Relay

- [ ] Simple cloud relay: S3 + single DynamoDB table
- [ ] `contextly push` / `contextly pull` — sync between machines
- [ ] Workspace-scoped tokens (no auth — just a random token that identifies your scope)
- [ ] $5/month (covers S3 + DynamoDB costs + 20% margin)

### Week 10: Cloud E2E

- [ ] Dogfood cloud relay: use Contextly on two machines
- [ ] Verify sync works across sessions
- [ ] Verify conflicts don't break anything
- [ ] Ship cloud relay as `contextly.cloud`

### Week 11: Cursor Integration

- [ ] Test MCP server with Cursor
- [ ] Fix any Cursor-specific issues
- [ ] Write the Cursor-specific setup guide
- [ ] Cross-post to Cursor community

### Week 12: Assessment

- [ ] Measure: do users who try Contextly keep using it after week 1?
- [ ] Measure: do agents reference context without prompting?
- [ ] Measure: how many constraints does the average project accumulate?
- [ ] Decision: do we have product-market fit for the thesis?
- [ ] If yes: plan v1 with teams, sync, conflict resolution
- [ ] If no: interview users, find out why, pivot or kill

---

## 5. What We Deliberately Ignore

We refuse to build these in the first 90 days:

| Feature | Reason We Refuse |
|---------|-----------------|
| **Cloud/hosted service** | Not until week 9. Prove local-first works first. |
| **Authentication** | No accounts. No login. No SSO. The MVP has no server. |
| **Multi-user** | The MVP is for one developer. Teams come after the thesis is proven. |
| **Fork/merge** | Branching is for teams. Not needed for a solo developer. |
| **Dashboard/UI** | The agent's chat is the UI. A dashboard adds nothing to the thesis. |
| **REST API** | MCP covers it. HTTP adds complexity for zero benefit at MVP stage. |
| **Vector search** | Not in the protocol. Not in the MVP. Not in the thesis. |
| **VS Code extension** | MCP covers this. A plugin is polish, not proof. |
| **CI/CD integration** | Not needed to prove agents make better decisions. |
| **Mobile** | Laughable at this stage. |
| **Enterprise features** | RBAC, SSO, audit logs — these serve organizations, not the thesis. |
| **Multiple scopes** | One scope per project. Generalize when needed. |
| **Tombstoning** | The user can delete `.contextly/` and start over. |
| **Conflict resolution** | Single user = no conflicts. Last writer wins. |

These are distractions. Every hour spent on any of these is an hour not spent on the thesis.

---

## 6. Success Metrics

### Primary Metric (The Thesis)

**Does the agent reference context entries in its reasoning without being prompted?**

Measured by: reviewing agent session logs. If the agent says "Based on the project constraints..." or "According to tech.stack..." without the developer mentioning it, the thesis is proven.

Target: 3 out of 5 sessions show unprompted constraint reference.

### Secondary Metrics

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Days active per user | Did the user use Contextly beyond day 1? | 7+ days |
| Constraints per project | How many entries accumulate? | 10+ after week 1 |
| Write frequency | How often do agents write new entries? | 2+ per session |
| Read frequency | How often do agents read context? | Every session |
| User reports "agent remembered" | Did the user notice the agent referencing context? | Yes, unprompted |

### Anti-Metrics (What We DON'T Optimize For)

- **Revenue**: Zero revenue expected in first 90 days. The thesis comes first.
- **Users**: 10 engaged users who report the agent remembers is worth more than 10,000 signups who never use it.
- **Performance**: The MVP handles one project. If it takes 100ms to compute the active set, that's fine. We optimize after proving the thesis.
- **Reliability**: If the file format changes between weeks, that's fine. The MVP is unstable by design.
- **Scalability**: The MVP is for one user. If it can't handle 1000 entries, we fix it when it becomes a problem.

### Go/No-Go Decision at Week 12

**Go**: At least 5 active users who report their agent remembers context without prompting. The project has 50+ GitHub stars from organic interest.

**No-Go**: Users try it once and don't come back. Agents don't reference context. The thesis feels wrong — agents don't actually benefit from inherited constraints. Kill the project or pivot to a different thesis.

---

**Start week 1 with: one TypeScript file, one JSON Lines file, one hypothesis.**

The rest is execution.