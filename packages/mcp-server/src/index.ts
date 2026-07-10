import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { MCP_SERVER_INFO } from "@contextly/shared";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CONTEXTLY_TOKEN = process.env.CONTEXTLY_TOKEN || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service role key — bypasses RLS. Token validation is done manually below.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedProjectId: string | null = null;

async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId;
  if (!CONTEXTLY_TOKEN) {
    throw new McpError(ErrorCode.InvalidRequest, "CONTEXTLY_TOKEN not set in environment.");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("mcp_token", CONTEXTLY_TOKEN)
    .single();

  if (error || !data) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid or unknown CONTEXTLY_TOKEN.`);
  }

  cachedProjectId = data.id;
  return data.id;
}

function parseSince(since: string | undefined): string {
  if (!since) {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  // Relative shortcuts
  const match = since.match(/^(\d+)(h|d|w)$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const ms = unit === 'h' ? value * 3600000 : unit === 'd' ? value * 86400000 : value * 604800000;
    return new Date(Date.now() - ms).toISOString();
  }
  // ISO 8601 — validate it
  const d = new Date(since);
  if (isNaN(d.getTime())) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid 'since' value: "${since}". Use ISO 8601 or "1h", "1d", "7d".`);
  }
  return d.toISOString();
}

const server = new Server(
  { name: MCP_SERVER_INFO.NAME, version: MCP_SERVER_INFO.VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_context",
      description: "Get the current project context, architecture decisions, and active goals. Returns up to 5 most recent relevant decisions.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Optional topic to focus on (e.g. 'auth', 'database', 'payments')" },
        },
      },
    },
    {
      name: "explain_file",
      description: "Get architectural history and key decisions related to a specific file path.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path relative to repo root (e.g. 'src/lib/auth.ts')" },
        },
        required: ["path"],
      },
    },
    {
      name: "recent_changes",
      description: "Get a summary of recent changes and decisions since a given time. Use this when resuming work or switching agents.",
      inputSchema: {
        type: "object",
        properties: {
          since: {
            type: "string",
            description: "Time filter: ISO 8601 datetime, or shorthand '1h', '1d', '7d'. Defaults to '7d'.",
          },
        },
      },
    },
    {
      name: "search_context",
      description: "Search for specific code logic or architectural patterns using natural language (semantic search).",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language query (e.g. 'how is authentication handled?')" },
        },
        required: ["query"],
      },
    },
    {
      name: "log_decision",
      description: "Log a significant architectural or project decision for future context. Call this when making an important choice.",
      inputSchema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "One-line summary of the decision (required)" },
          reasoning: { type: "string", description: "The reasoning, tradeoffs, and 'why' behind it (required)" },
          related_files: {
            type: "array",
            items: { type: "string" },
            description: "Files affected by this decision",
          },
        },
        required: ["summary", "reasoning"],
      },
    },
  ],
}));

async function logAudit(projectId: string, action: string, entityType: string, metadata: any = {}) {
  try {
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      action,
      entity_type: entityType,
      metadata: {
        ...metadata,
        agent: MCP_SERVER_INFO.NAME,
        version: MCP_SERVER_INFO.VERSION
      }
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const projectId = await getProjectId();

    // Log the tool call for auditing
    await logAudit(projectId, `call_${name}`, "context", { arguments: args });

    switch (name) {
      case "get_context": {
        const { topic } = (args as { topic?: string }) || {};

        let query = supabase
          .from("decisions")
          .select("id, summary, reasoning, related_files, source, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (topic) {
          query = query.ilike("summary", `%${topic.replace(/[%_]/g, '\\$&')}%`);
        }

        const { data: decisions, error } = await query;
        if (error) throw error;

        if (!decisions || decisions.length === 0) {
          return {
            content: [{
              type: "text",
              text: topic
                ? `No context recorded for topic "${topic}" yet.`
                : "No recorded context yet. Use log_decision to start capturing architectural decisions.",
            }],
          };
        }

        const lastUpdated = decisions[0].created_at;
        const contextText = decisions.map((d) =>
          `[${new Date(d.created_at).toLocaleDateString()}] ${d.summary}\nReasoning: ${d.reasoning || 'N/A'}\nSource: ${d.source}\nFiles: ${d.related_files?.join(", ") || "none"}`
        ).join("\n\n---\n\n");

        return {
          content: [{
            type: "text",
            text: `Project Context${topic ? ` — "${topic}"` : ""}:\nLast updated: ${new Date(lastUpdated).toLocaleString()}\n\n${contextText}`,
          }],
        };
      }

      case "explain_file": {
        const { path: filePath } = args as { path: string };

        if (!filePath || filePath.trim() === "") {
          throw new McpError(ErrorCode.InvalidParams, "path is required.");
        }

        const { data: decisions, error } = await supabase
          .from("decisions")
          .select("summary, reasoning, created_at, source")
          .eq("project_id", projectId)
          .contains("related_files", [filePath])
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!decisions || decisions.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No decisions recorded for ${filePath}. This file has no architectural history yet.`,
            }],
          };
        }

        const explanation = decisions.map((d) =>
          `[${new Date(d.created_at).toLocaleDateString()}] ${d.summary}\nReasoning: ${d.reasoning || 'N/A'}`
        ).join("\n\n");

        return {
          content: [{ type: "text", text: `Architectural history for ${filePath}:\n\n${explanation}` }],
        };
      }

      case "recent_changes": {
        const { since } = (args as { since?: string }) || {};
        const sinceIso = parseSince(since);

        const [changesResult, decisionsResult] = await Promise.all([
          supabase
            .from("changes")
            .select("summary, commit_sha, created_at")
            .eq("project_id", projectId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("decisions")
            .select("summary, reasoning, source, created_at")
            .eq("project_id", projectId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (changesResult.error) throw changesResult.error;
        if (decisionsResult.error) throw decisionsResult.error;

        const changes = changesResult.data || [];
        const decisions = decisionsResult.data || [];

        if (changes.length === 0 && decisions.length === 0) {
          return {
            content: [{ type: "text", text: `No changes or decisions recorded since ${new Date(sinceIso).toLocaleString()}.` }],
          };
        }

        const sinceLabel = since || "7d";
        let output = `Recent activity since ${sinceLabel}:\n`;

        if (changes.length > 0) {
          output += `\n## Commits (${changes.length})\n`;
          output += changes.map((c) =>
            `- [${new Date(c.created_at).toLocaleDateString()}] ${c.summary} (${c.commit_sha?.substring(0, 7) || "no-sha"})`
          ).join("\n");
        }

        if (decisions.length > 0) {
          output += `\n\n## Decisions (${decisions.length})\n`;
          output += decisions.map((d) =>
            `- [${new Date(d.created_at).toLocaleDateString()}] [${d.source}] ${d.summary}`
          ).join("\n");
        }

        return { content: [{ type: "text", text: output }] };
      }

      case "search_context": {
        const { query } = args as { query: string };

        // Mock generating embedding for the query
        const queryEmbedding = Array.from({ length: 1536 }, () => Math.random());

        // Call the pgvector RPC
        const { data: matches, error } = await supabase.rpc("match_embeddings", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          p_project_id: projectId
        });

        if (error) throw error;

        if (!matches || matches.length === 0) {
          return { content: [{ type: "text", text: `No semantic matches found for "${query}".` }] };
        }

        const results = matches.map((m: any) =>
          `[Similarity: ${Math.round(m.similarity * 100)}%] Path: ${m.metadata?.path}\nContent: ${m.content}...`
        ).join("\n\n---\n\n");

        return {
          content: [{ type: "text", text: `Semantic Search Results for "${query}":\n\n${results}` }]
        };
      }

      case "log_decision": {
        const { summary, reasoning, related_files = [] } = args as {
          summary: string;
          reasoning: string;
          related_files?: string[];
        };

        if (!summary || summary.trim() === "") {
          throw new McpError(ErrorCode.InvalidParams, "summary is required and cannot be empty.");
        }
        if (!reasoning || reasoning.trim() === "") {
          throw new McpError(ErrorCode.InvalidParams, "reasoning is required and cannot be empty.");
        }

        const { data, error } = await supabase
          .from("decisions")
          .insert({
            project_id: projectId,
            summary: summary.trim(),
            reasoning: reasoning.trim(),
            related_files,
            source: "agent_logged",
          })
          .select("id, created_at")
          .single();

        if (error) throw error;

        return {
          content: [{
            type: "text",
            text: `Decision logged: "${summary}"\nID: ${data.id}\nRecorded at: ${new Date(data.created_at).toLocaleString()}`,
          }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
