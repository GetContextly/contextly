# Coding Conventions

Keep this short and actually followed, rather than long and ignored. Applies across all packages unless a package-specific override is noted.

## Language & Style

- **TypeScript everywhere**, strict mode on (`"strict": true` in every package's `tsconfig.json`). No `any` unless there's a comment explaining why it's unavoidable.
- Prefer explicit return types on exported functions — helps agents (and you) understand a function's contract without reading its body
- Async/await over raw `.then()` chains

## Naming

- Files: `kebab-case.ts` (e.g. `get-context.ts`, not `getContext.ts`)
- Types/interfaces: `PascalCase` (e.g. `Decision`, `ProjectMember`)
- Functions/variables: `camelCase`
- Constants that are truly fixed (e.g. rate limit thresholds): `SCREAMING_SNAKE_CASE`
- MCP tool names stay exactly as defined in `docs/API_CONTRACTS.md` — `get_context`, not `getContext`, since this matches the MCP protocol's own convention

## Error Handling

- Never swallow errors silently — a caught error either gets handled meaningfully or re-thrown, never just logged and ignored
- User-facing CLI errors should be plain English, not a raw stack trace — reserve stack traces for a `--verbose` flag
- Every MCP tool should return a structured error (not throw an unhandled exception) so the calling agent gets something interpretable back

## File Organization (within a package)

```
packages/<name>/
├── src/
│   ├── commands/       # CLI only — one file per command
│   ├── tools/          # MCP server only — one file per tool
│   ├── lib/            # shared internal helpers for that package
│   └── index.ts        # entry point
├── tests/
└── package.json
```

## Testing

- Test files live alongside source (`login.ts` + `login.test.ts`) or in a parallel `tests/` folder — pick one convention per package and stay consistent within it
- Every MCP tool needs at least one test covering: normal case, empty/no-data case, invalid-input case
- Don't mock Supabase for every test — some tests should run against a real local Supabase instance (via `supabase start`) to catch RLS/schema issues that mocks would hide

## Commit Messages

Follow conventional commits, matching the examples used throughout `docs/MILESTONES_AND_TESTING.md`:

```
<type>(<scope>): <short description>

feat(cli): implement init command
fix(mcp): handle empty project state
docs: update architecture doc with bot commit mechanism
chore: add supabase cli config
test(auth): verify token scope boundaries
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`
Scope: the package or area affected (`cli`, `mcp`, `dashboard`, `db`, `auth`, `billing`, or omit for repo-wide changes)

## Comments

- Comment *why*, not *what* — the code already says what it does; a comment should explain a non-obvious reason for doing it that way
- If a decision was made for a reason that isn't obvious from the code, consider whether it should actually be a logged `Decision` in Contextly itself, not just a code comment — this project should eat its own dog food

## Formatting

- Use Prettier with default-ish settings (single quotes, semicolons, 2-space indent) — set up once at the repo root, don't bikeshed on this per package
- Run formatting as a pre-commit hook if possible, so style debates never show up in commit history
