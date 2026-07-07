# How AI Agents Pick Up a Contextly Project

This is the actual product experience — the moment where the value either lands or doesn't. Getting this frictionless matters more than any other single piece.

---

## The Setup Moment (`contextly init`)

Running `npx contextly init` inside a project should do all of the following, so the dev never has to configure anything by hand:

1. Authenticate (or prompt login if not already signed in)
2. Register the GitHub webhook (see GITHUB_INTEGRATION.md)
3. Scan the repo once to generate a starter brief — detect stack, folder structure, key modules, README content if present
4. Write an MCP config file into the project (e.g. `.contextly/mcp.json`) containing the project's server URL and scoped token
5. Print clear next-step instructions for connecting each supported agent (see below)

---

## Connecting Each Agent

Different tools discover MCP servers differently. Document each explicitly so a dev isn't guessing:

### Claude Code
Claude Code reads MCP server configs from a project or user-level config file. `contextly init` should either:
- Automatically add an entry to the existing Claude Code MCP config if one is present, or
- Print the exact JSON snippet to add, if editing config files automatically feels too invasive

### Cursor
Cursor supports MCP servers via its own settings file. Same approach: auto-write if safe, otherwise print the snippet with a copy-paste-ready block.

### Other/future agents
For any tool that supports the MCP standard, the same server URL + token combination should work — this is the whole point of building on MCP rather than a proprietary integration per tool. Document the generic connection format once, and reference it for "any MCP-compatible agent."

**Important:** always show the user exactly what got written to their config, and where. Silent, invisible edits to a dev's tool configs erode trust fast — treat every automatic file write as something to confirm and disclose in the output.

---

## What Happens the Moment an Agent Connects

1. Agent's MCP client opens a session against the Contextly server using the project token
2. Server does the **lazy sync check** (see ARCHITECTURE.md) — anything changed since the last connection?
3. Server does *not* dump the whole brief into the agent's context automatically — it waits for the agent to ask
4. Agent, per its own reasoning, calls the relevant tool as needed:
   - `get_context(topic)` when it needs background on a specific area
   - `explain_file(path)` when it's about to touch a file and wants history
   - `recent_changes(since)` when picking up after time away
   - `log_decision(summary, reasoning)` when it makes a meaningful choice worth remembering

This "ask, don't dump" pattern is what keeps token costs low and avoids the exact failure mode of a giant static doc getting pasted into every session regardless of relevance.

---

## The "Switching Agents Mid-Task" Scenario (core value moment)

This is the single most important user journey to nail, since it's the sharpest pain point:

1. Dev is deep into a task with Claude Code, hits a usage limit
2. Opens Cursor on the same project — Cursor's MCP client connects to the *same* Contextly server (same project token, already configured from `init`)
3. Cursor calls `recent_changes(since: last_hour)` and `get_context(topic: current_task)` 
4. Dev gets a coherent continuation instead of re-explaining everything from scratch

Everything in the CLI setup and MCP tool design should be built with this exact scenario as the north star — if this moment doesn't feel seamless, the product hasn't earned its core pitch.

---

## Things to Get Right Early

- **First-connection latency** — if connecting an agent to a fresh project takes more than a couple seconds, it undermines the "instant continuity" pitch
- **Clear tool descriptions** — MCP tool descriptions are what the agent's own reasoning uses to decide when to call them; vague descriptions mean agents won't use the tools at the right moments
- **Graceful empty state** — a brand-new project with no history yet should return something useful ("no decisions logged yet, but here's the detected stack") rather than an empty or error response
