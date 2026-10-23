import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Compiler, Store, type CompiledContext, type Conflict, type ContextEntry, type InsertEntry, computeId } from "@contextly/protocol";
import { parseToken, validateScope, verifyTokenIntegrity, type TokenPayload } from "./auth.js";
import { RateLimiter } from "./rate-limiter.js";
import { contextlyErrorToMcpError, type ContextlyError } from "./errors.js";

interface McpServerConfig {
  token: string;
  dbPath?: string;
  validTokens?: string[];
  rateLimits?: Record<string, { windowMs: number; maxRequests: number }>;
}

function parseScopeAncestors(scope: string): string[] {
  const parts = scope.split(".");
  const ancestors: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("."));
  }
  return ancestors;
}

export function createMcpServer(config: McpServerConfig) {
  const tokenPayload = parseToken(config.token);
  const validTokens = new Set(config.validTokens ?? [config.token]);

  const store = new Store(config.dbPath ?? ":memory:");
  const compiler = new Compiler(store);
  const rateLimiter = new RateLimiter(config.rateLimits);

  function authenticate(token: string, scope: string, permission: "read" | "write" | "resolve" | "fork" | "merge"): TokenPayload {
    const payload = verifyTokenIntegrity(token, validTokens);
    validateScope(payload.scope, scope, permission, payload.permissions);
    return payload;
  }

  const server = new Server(
    { name: "contextly-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "read_context",
        description:
          "Read compiled context for a scope. Returns the active set (rules first, then decisions, then observations) with provenance. Honors token budget — compresses observations before dropping, never drops rules silently. Every dropped entry is logged.",
        inputSchema: {
          type: "object",
          properties: {
            scope: { type: "string", description: "Dotted-path scope, e.g. project.myapp" },
            token: { type: "string", description: "Authentication token for this scope" },
            budget: { type: "number", description: "Token budget (default: unlimited)", default: 0 },
            kind: { type: "string", description: "Filter by kind: rule, decision, or observation", enum: ["rule", "decision", "observation"] },
            cid: { type: "string", description: "Filter by cid or cid prefix (e.g. auth.*)" },
            task: { type: "string", description: "Task description for relevance ranking" },
          },
          required: ["scope", "token"],
        },
      },
      {
        name: "commit",
        description:
          "Record a new context entry. Idempotent — same cid + message + scope produces the same id and is silently accepted on retry. If a conflict is detected (same cid, different message, no supersession), both entries remain active and the conflict is returned.",
        inputSchema: {
          type: "object",
          properties: {
            scope: { type: "string", description: "Dotted-path scope" },
            token: { type: "string", description: "Authentication token" },
            cid: { type: "string", description: "Dotted-path cid, e.g. auth.provider" },
            message: { type: "string", description: "The memory — plain text, one sentence" },
            kind: { type: "string", description: "Entry kind", enum: ["decision", "rule", "observation"] },
            supersedes: { type: "string", description: "Id of entry this supersedes, if resolving a conflict" },
          },
          required: ["scope", "token", "cid", "message", "kind"],
        },
      },
      {
        name: "query",
        description:
          "Raw entry lookup, bypassing compilation. Use for tooling and debugging. Returns exact matches without inheritance or conflict resolution.",
        inputSchema: {
          type: "object",
          properties: {
            scope: { type: "string", description: "Dotted-path scope" },
            token: { type: "string", description: "Authentication token" },
            cid: { type: "string", description: "Filter by exact cid" },
            kind: { type: "string", description: "Filter by kind", enum: ["rule", "decision", "observation"] },
            status: { type: "string", description: "Filter by status", enum: ["active", "superseded", "archived", "tombstoned"] },
            id: { type: "string", description: "Lookup by exact entry id" },
          },
          required: ["scope", "token"],
        },
      },
      {
        name: "resolve",
        description:
          "Resolve a conflict by superseding one of the conflicting entries. Writes a new entry with supersedes set to the entry you want to replace. Equivalent to commit() with supersedes set.",
        inputSchema: {
          type: "object",
          properties: {
            scope: { type: "string", description: "Dotted-path scope" },
            token: { type: "string", description: "Authentication token" },
            cid: { type: "string", description: "The cid with the conflict" },
            message: { type: "string", description: "The resolution message" },
            kind: { type: "string", description: "Entry kind", enum: ["decision", "rule", "observation"] },
            supersedingId: { type: "string", description: "Id of the entry to supersede (the one being replaced)" },
          },
          required: ["scope", "token", "cid", "message", "kind", "supersedingId"],
        },
      },
      {
        name: "fork",
        description:
          "Create a new scope as a child of an existing one. The child inherits the parent's active set. No entries are copied — the fork maintains a reference to the parent. Only succeeds if parent scope exists.",
        inputSchema: {
          type: "object",
          properties: {
            scope: { type: "string", description: "Name for the new child scope" },
            parentScope: { type: "string", description: "Existing parent scope to inherit from" },
            token: { type: "string", description: "Authentication token (must have access to parentScope)" },
          },
          required: ["scope", "parentScope", "token"],
        },
      },
      {
        name: "merge",
        description:
          "Merge entries from source scope into target scope. Conflicts are returned — they must be resolved before the merge can complete. Adopts all non-conflicting entries atomically.",
        inputSchema: {
          type: "object",
          properties: {
            source: { type: "string", description: "Source scope to merge from" },
            target: { type: "string", description: "Target scope to merge into" },
            token: { type: "string", description: "Authentication token (must have access to both scopes)" },
          },
          required: ["source", "target", "token"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params as { name: string; arguments: Record<string, unknown> };

    try {
      switch (name) {
        case "read_context":
          return handleReadContext(args);
        case "commit":
          return handleCommit(args);
        case "query":
          return handleQuery(args);
        case "resolve":
          return handleResolve(args);
        case "fork":
          return handleFork(args);
        case "merge":
          return handleMerge(args);
        default:
          throw new McpError(-32601, `Unknown tool: ${name}`);
      }
    } catch (err) {
      if (err instanceof McpError) throw err;
      const ctxErr = err as ContextlyError;
      if (ctxErr.code) {
        throw new McpError(
          contextlyErrorToMcpError(ctxErr).code,
          JSON.stringify(ctxErr),
        );
      }
      throw new McpError(-32603, JSON.stringify({ code: "INTERNAL_ERROR", message: (err as Error).message }));
    }
  });

  // ─── Tool handlers ─────────────────────────────────────────────────

  function handleReadContext(args: Record<string, unknown>) {
    const { token, scope } = args as { token: string; scope: string };
    authenticate(token, scope, "read");

    const budget = typeof args.budget === "number" ? args.budget : undefined;
    const kind = typeof args.kind === "string" ? args.kind as "rule" | "decision" | "observation" : undefined;
    const cid = typeof args.cid === "string" ? args.cid : undefined;
    const task = typeof args.task === "string" ? args.task : undefined;

    const compiled = compiler.compile({ scope, budget, kind, cid, task });
    const payload = formatCompiledForMcp(compiled);

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }

  function handleCommit(args: Record<string, unknown>) {
    const { token, scope, cid, message, kind } = args as {
      token: string; scope: string; cid: string; message: string; kind: string;
    };
    authenticate(token, scope, "write");

    if (!message.trim()) {
      return errorResponse("VALIDATION_ERROR", "Message cannot be empty");
    }

    const insertEntry: InsertEntry = {
      scope,
      cid,
      message: message.trim(),
      kind: kind as "decision" | "rule" | "observation",
      author: token,
      supersedes: typeof args.supersedes === "string" ? args.supersedes : undefined,
    };

    // Idempotency: check if this exact entry already exists
    const existingId = computeId(scope, cid, message.trim());
    const existing = store.getById(existingId);
    if (existing) {
      return { content: [{ type: "text", text: JSON.stringify({ id: existing.id, status: "already_exists", entry: existing }, null, 2) }] };
    }

    // Track scope version for cache invalidation
    compiler.invalidateScope(scope);
    const result = store.insert(insertEntry);

    const response: Record<string, unknown> = {
      id: result.entry.id,
      status: "committed",
      entry: result.entry,
    };

    if (result.conflict) {
      response.status = "conflict";
      response.conflict = {
        cid: result.conflict.cid,
        existingMessage: result.conflict.existingEntry.message,
        existingId: result.conflict.existingEntry.id,
        incomingMessage: result.conflict.incomingEntry.message,
        incomingId: result.conflict.incomingEntry.id,
      };
    }

    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }

  function handleQuery(args: Record<string, unknown>) {
    const { token, scope } = args as { token: string; scope: string };
    authenticate(token, scope, "read");

    const id = typeof args.id === "string" ? args.id : undefined;
    const cid = typeof args.cid === "string" ? args.cid : undefined;
    const kind = typeof args.kind === "string" ? args.kind : undefined;
    const status = typeof args.status === "string" ? args.status : undefined;

    if (id) {
      const entry = store.getById(id);
      if (!entry) {
        return errorResponse("SCOPE_NOT_FOUND", `Entry ${id} not found`);
      }
      return { content: [{ type: "text", text: JSON.stringify({ entries: [entry] }, null, 2) }] };
    }

    if (cid) {
      const entries = store.getByScopeAndCid(scope, cid);
      return { content: [{ type: "text", text: JSON.stringify({ entries }, null, 2) }] };
    }

    let entries = store.getAllActiveForScope(scope);

    if (kind) {
      entries = entries.filter((e) => e.kind === kind);
    }
    if (status) {
      entries = entries.map((e) => e).filter((e) => e.status === status);
    }

    return { content: [{ type: "text", text: JSON.stringify({ entries }, null, 2) }] };
  }

  function handleResolve(args: Record<string, unknown>) {
    const { token, scope, cid, message, kind, supersedingId } = args as {
      token: string; scope: string; cid: string; message: string; kind: string; supersedingId: string;
    };
    authenticate(token, scope, "resolve");

    const target = store.getById(supersedingId);
    if (!target) {
      return errorResponse("SUPERSEDES_TARGET_NOT_FOUND", `Entry ${supersedingId} not found`);
    }

    const insertEntry: InsertEntry = {
      scope,
      cid,
      message: message.trim(),
      kind: kind as "decision" | "rule" | "observation",
      author: token,
      supersedes: supersedingId,
    };

    compiler.invalidateScope(scope);
    const result = store.insert(insertEntry);

    const response: Record<string, unknown> = {
      id: result.entry.id,
      status: "resolved",
      supersededId: supersedingId,
      entry: result.entry,
    };

    if (result.conflict) {
      response.status = "conflict_persists";
      response.conflict = {
        cid: result.conflict.cid,
        existingId: result.conflict.existingEntry.id,
        incomingId: result.conflict.incomingEntry.id,
      };
    }

    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }

  function handleFork(args: Record<string, unknown>) {
    const { scope, parentScope, token } = args as { scope: string; parentScope: string; token: string };
    authenticate(token, parentScope, "fork");

    if (!store.scopeExists(parentScope)) {
      return errorResponse("SCOPE_NOT_FOUND", `Parent scope "${parentScope}" does not exist`);
    }

    if (store.scopeExists(scope)) {
      return errorResponse("VALIDATION_ERROR", `Scope "${scope}" already exists`);
    }

    // Fork by writing a sentinel entry — the Compiler handles inheritance
    store.insert({
      scope,
      cid: "_fork",
      message: `Forked from ${parentScope}`,
      kind: "observation",
      author: token,
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          scope,
          parentScope,
          status: "forked",
          inheritedEntries: compiler.compile({ scope }).stats.inherited,
        }, null, 2),
      }],
    };
  }

  function handleMerge(args: Record<string, unknown>) {
    const { source, target, token } = args as { source: string; target: string; token: string };
    authenticate(token, source, "read");
    authenticate(token, target, "merge");

    if (!store.scopeExists(source)) {
      return errorResponse("SCOPE_NOT_FOUND", `Source scope "${source}" does not exist`);
    }
    if (!store.scopeExists(target)) {
      return errorResponse("SCOPE_NOT_FOUND", `Target scope "${target}" does not exist`);
    }

    const sourceActive = store.getAllActiveForScope(source);
    const targetActive = store.getAllActiveForScope(target);

    const adopted: ContextEntry[] = [];
    const conflicts: Conflict[] = [];
    const rejected: ContextEntry[] = [];

    for (const entry of sourceActive) {
      const targetEntry = store.getByScopeAndCid(target, entry.cid);
      if (targetEntry.length === 0) {
        // No entry in target — adopt (re-insert with new scope)
        const result = store.insert({
          cid: entry.cid,
          message: entry.message,
          kind: entry.kind,
          scope: target,
          author: entry.author,
          supersedes: undefined,
        });
        adopted.push(result.entry);
      } else if (targetEntry.length === 1 && targetEntry[0].message === entry.message) {
        // Same message — skip (duplicate)
        rejected.push(entry);
      } else if (targetEntry.length >= 1 && targetEntry[0].message !== entry.message) {
        // Different message — conflict
        conflicts.push({
          scope: target,
          cid: entry.cid,
          existingEntry: targetEntry[0],
          incomingEntry: entry,
        });
      } else {
        // Multiple target entries or error
        conflicts.push({
          scope: target,
          cid: entry.cid,
          existingEntry: targetEntry[0],
          incomingEntry: entry,
        });
      }
    }

    if (conflicts.length > 0) {
      return errorResponse("MERGE_CONFLICT", `Merge has ${conflicts.length} conflict(s) that must be resolved first`, {
        adopted: adopted.length,
        conflicts: conflicts.map((c) => ({
          cid: c.cid,
          existingMessage: c.existingEntry.message,
          incomingMessage: c.incomingEntry.message,
        })),
        rejected: rejected.length,
      });
    }

    compiler.invalidateScope(target);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "merged",
          adopted: adopted.length,
          conflicts: 0,
          rejected: rejected.length,
          entries: adopted.map((e) => ({ id: e.id, cid: e.cid, message: e.message, kind: e.kind })),
        }, null, 2),
      }],
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  function formatCompiledForMcp(compiled: CompiledContext) {
    return {
      entries: compiled.entries.map((ce) => ({
        id: ce.entry.id,
        cid: ce.entry.cid,
        message: ce.entry.message,
        kind: ce.entry.kind,
        timestamp: ce.entry.timestamp,
        provenance: ce.provenance,
      })),
      conflicts: compiled.conflicts.map((c) => ({
        cid: c.cid,
        existingMessage: c.existingEntry.message,
        existingId: c.existingEntry.id,
        incomingMessage: c.incomingEntry.message,
        incomingId: c.incomingEntry.id,
      })),
      stats: compiled.stats,
      dropped: compiled.dropped,
    };
  }

  function errorResponse(code: string, message: string, details?: Record<string, unknown>) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ error: { code, message, ...details } }, null, 2),
      }],
      isError: true,
    };
  }

  return { server, store, compiler, rateLimiter, start };

  async function start() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

// ─── CLI entry point ────────────────────────────────────────────────

async function main() {
  const token = process.env.CONTEXTLY_TOKEN;
  if (!token) {
    console.error("CONTEXTLY_TOKEN environment variable required");
    process.exit(1);
  }

  const dbPath = process.env.CONTEXTLY_DB_PATH;
  const { start } = createMcpServer({ token, dbPath });
  await start();
}

if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("mcp-server")) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}