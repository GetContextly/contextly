# Contextly Agent SDK Quickstart

The SDK is how agents read and write context programmatically. Three verbs,
one config value, no boilerplate.

## Installation

```bash
# TypeScript
npm install @contextly/sdk

# Python
pip install contextly
```

## Quickstart (TypeScript)

```typescript
import { Contextly } from "@contextly/sdk";

const ctx = new Contextly({ token: "ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe" });

const brief = await ctx.read({ task: "What tech stack?", budget: 2000 });
console.log(brief.entries.map(e => `${e.cid}: ${e.message}`).join("\n"));

await ctx.commit({ cid: "stack.choice", message: "Next.js + Supabase" });
```

That is the entire API surface for 90 % of use cases: **read** what the team
already decided, then **commit** your own decisions.

## Quickstart (Python)

```python
from contextly import Contextly

ctx = Contextly(token="ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe")

brief = ctx.read(task="What tech stack?", budget=2000)
for e in brief["entries"]:
    print(f"{e['cid']}: {e['message']}")

ctx.commit(cid="stack.choice", message="Next.js + Supabase")
```

## API

| Method | Purpose | Key fields |
|--------|---------|------------|
| `read(options?)` | Compiled context for this scope | `budget`, `kind`, `cid`, `task` |
| `commit(input)` | Persist a decision or rule | `cid`, `message`, `kind`, `supersedes` |
| `query(filter?)` | Raw entry lookup | `id`, `cid`, `kind`, `status` |
| `resolve(input)` | Override a conflicting entry | `cid`, `message`, `kind`, `supersedingId` |
| `fork(scope, parent)` | Branch a scope | — |
| `merge(input)` | Reconcile two scopes | `source`, `target` |
| `onConflict(handler, pollMs?)` | Subscribe to conflicts | Returns unsubscribe fn |

## Token format

```
ctx_{scope}_{base62random}
```

The scope is embedded in the token — you never pass it separately. Generate
tokens via the Contextly CLI or dashboard.

## Error messages

Every error returns a human explanation, not an HTTP code:

- `"Scope not authorized: your token cannot access the requested scope."`
- `"Conflict detected: another agent already made a different decision for this cid."`
- `"Token must start with 'ctx_'."`

## Next steps

- See `examples/persistent-agent/` for a cross-session persistence demo
- Read `docs/PROTOCOL.md` for the wire format
- Read `docs/API_CONTRACTS.md` for exact MCP tool signatures