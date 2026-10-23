import { Client } from "@modelcontextprotocol/sdk/client";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import { createMcpServer } from "@contextly/mcp-server";
import { translateError } from "./errors";
import type {
  ContextlyConfig,
  ReadOptions,
  ReadResult,
  CommitInput,
  CommitResult,
  QueryFilter,
  QueryResult,
  ResolveInput,
  ResolveResult,
  ForkResult,
  MergeInput,
  MergeResult,
  ConflictInfo,
} from "./types";

function parseToken(token: string): string {
  if (!token.startsWith("ctx_")) {
    throw new Error("Token must start with 'ctx_'. Example: ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe");
  }
  const withoutPrefix = token.slice(4);
  const underscoreIdx = withoutPrefix.lastIndexOf("_");
  if (underscoreIdx === -1) {
    throw new Error(
      "Invalid token format. Expected: ctx_{scope}_{random}. Example: ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe",
    );
  }
  const scope = withoutPrefix.slice(0, underscoreIdx);
  if (!scope) {
    throw new Error("Token scope cannot be empty. A scope like 'project.myapp' must be embedded in the token.");
  }
  return scope;
}

function extractContent(result: any): unknown {
  const text = result.content.find((c: { type: string }) => c.type === "text")?.text;
  if (!text) throw new Error("Empty response from server");
  const parsed = JSON.parse(text);
  if (result.isError || parsed.error) {
    throw translateError(parsed.error ?? { code: "INTERNAL_ERROR", message: text });
  }
  return parsed;
}

export class Contextly {
  private client: Client;
  private token: string;
  private _scope: string;
  private conflictHandlers: Array<(conflict: ConflictInfo) => void> = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private ready: Promise<void>;

  constructor(config: ContextlyConfig) {
    this._scope = parseToken(config.token);
    this.token = config.token;

    const { server } = createMcpServer({
      token: config.token,
      dbPath: config.dbPath,
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    this.client = new Client({ name: "contextly-sdk", version: "1.0.0" }, { capabilities: {} });

    this.ready = Promise.all([
      server.connect(serverTransport),
      this.client.connect(clientTransport),
    ]).then(() => undefined);
  }

  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  get scope(): string {
    return this._scope;
  }

  async read(options?: ReadOptions): Promise<ReadResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "read_context",
      arguments: {
        scope: this._scope,
        token: this.token,
        budget: options?.budget,
        kind: options?.kind,
        cid: options?.cid,
        task: options?.task,
      },
    });
    return extractContent(result) as ReadResult;
  }

  async commit(input: CommitInput): Promise<CommitResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "commit",
      arguments: {
        scope: this._scope,
        token: this.token,
        cid: input.cid,
        message: input.message,
        kind: input.kind ?? "decision",
        supersedes: input.supersedes,
      },
    });
    const parsed = extractContent(result) as CommitResult;
    if (parsed.conflict) {
      for (const handler of this.conflictHandlers) {
        try { handler(parsed.conflict); } catch { /* silent */ }
      }
    }
    return parsed;
  }

  async query(filter?: QueryFilter): Promise<QueryResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "query",
      arguments: {
        scope: filter?.cid || filter?.id ? this._scope : this._scope,
        token: this.token,
        cid: filter?.cid,
        kind: filter?.kind,
        status: filter?.status,
        id: filter?.id,
      },
    });
    return extractContent(result) as QueryResult;
  }

  async resolve(input: ResolveInput): Promise<ResolveResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "resolve",
      arguments: {
        scope: this._scope,
        token: this.token,
        cid: input.cid,
        message: input.message,
        kind: input.kind,
        supersedingId: input.supersedingId,
      },
    });
    return extractContent(result) as ResolveResult;
  }

  async fork(scope: string, parentScope: string): Promise<ForkResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "fork",
      arguments: { scope, parentScope, token: this.token },
    });
    return extractContent(result) as ForkResult;
  }

  async merge(input: MergeInput): Promise<MergeResult> {
    await this.ensureReady();
    const result = await this.client.callTool({
      name: "merge",
      arguments: {
        source: input.source,
        target: input.target,
        token: this.token,
      },
    });
    return extractContent(result) as MergeResult;
  }

  onConflict(handler: (conflict: ConflictInfo) => void, pollMs?: number): () => void {
    this.conflictHandlers.push(handler);
    if (pollMs && pollMs > 0 && !this.pollTimer) {
      this.pollTimer = setInterval(async () => {
        try {
          const ctx = await this.read();
          for (const c of ctx.conflicts ?? []) {
            for (const h of this.conflictHandlers) {
              try { h(c); } catch { /* silent */ }
            }
          }
        } catch { /* poll errors are silent */ }
      }, pollMs);
    }
    return () => {
      this.conflictHandlers = this.conflictHandlers.filter((h) => h !== handler);
      if (this.conflictHandlers.length === 0 && this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    };
  }
}