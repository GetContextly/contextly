import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { MCP_SERVER_INFO, parseSince, createMcpResponse } from "@contextly/shared";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CONTEXTLY_TOKEN = process.env.CONTEXTLY_TOKEN || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!CONTEXTLY_TOKEN) {
  console.error("Missing CONTEXTLY_TOKEN — set it in your .contextly/mcp.json or environment");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedProjectId: string | null = null;

async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId;

  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("mcp_token", CONTEXTLY_TOKEN)
    .single();

  if (error || !data) {
    throw new McpError(ErrorCode.InvalidRequest, "Invalid token — no project found.");
  }

  cachedProjectId = data.id;
  return data.id;
}

async function enforceRateLimit(projectId: string) {
  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_key: `mcp_${projectId}`,
    p_limit: 100,
    p_window: "1 minute",
  });

  if (error) console.error("Rate limit check failed:", error.message);
  if (!allowed) {
    throw new McpError(ErrorCode.InvalidRequest, "Rate limit exceeded. Try again shortly.");
  }
}

// --- Zod schemas matching API_CONTRACTS.md exactly ---

const GetContextSchema = z.object({
  topic: z.string().describe("Topic to search for, e.g. 'authentication', 'database schema'"),
});

const ExplainFileSchema = z.object({
  path: z.string().describe("Relative file path, e.g. 'src/auth/login.ts'"),
});

const RecentChangesSchema = z.object({
  since: z.string().describe('ISO 8601 timestamp or shorthand like "1h", "1d", "7d"'),
});

const LogDecisionSchema = z.object({
  summary: z.string().describe("Plain-English one-liner describing the decision"),
  reasoning: z.string().describe('The "why" behind the decision'),
  related_files: z.array(z.string()).optional().describe("Optional list of related file paths"),
});

// --- Server setup ---

const server = new Server(
  { name: MCP_SERVER_INFO.NAME, version: MCP_SERVER_INFO.VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_context",
      description:
        "Query project memory by topic. Returns a plain-English summary and related architectural decisions. Use this when you need to understand why something was built a certain way.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: 'Topic to search for, e.g. "authentication", "database schema", "deployment"',
          },
        },
        required: ["topic"],
      },
    },
    {
      name: "explain_file",
      description:
        "Get context about a specific file — what decisions led to it, why it exists. Returns whether the file is tracked in the project.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: 'Relative file path, e.g. "src/auth/login.ts"',
          },
        },
        required: ["path"],
      },
    },
    {
      name: "recent_changes",
      description:
        "See what changed recently in the project. Returns changes and decisions from a time window. Use before making modifications to understand current state.",
      inputSchema: {
        type: "object",
        properties: {
          since: {
            type: "string",
            description: 'ISO 8601 timestamp or relative shorthand like "1h", "1d", "7d"',
          },
        },
        required: ["since"],
      },
    },
    {
      name: "log_decision",
      description:
        "Record an architectural decision you've made while working on the project. This persists context for future agents and sessions.",
      inputSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Plain-English one-liner describing the decision",
          },
          reasoning: {
            type: "string",
            description: "The why behind the decision",
          },
          related_files: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of related file paths",
          },
        },
        required: ["summary", "reasoning"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const projectId = await getProjectId();
  await enforceRateLimit(projectId);

  switch (name) {
    // ─── get_context ───────────────────────────────────────────
    case "get_context": {
      const { topic } = GetContextSchema.parse(args);

      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, project_id, summary, reasoning, source, related_files, created_at")
        .eq("project_id", projectId)
        .or(`summary.ilike.%${topic}%,reasoning.ilike.%${topic}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      const list = decisions || [];

      if (list.length === 0) {
        return createMcpResponse(
          JSON.stringify({
            summary: "No recorded context for this topic yet.",
            related_decisions: [],
            last_updated: new Date().toISOString(),
          })
        );
      }

      const summary = `Found ${list.length} decision(s) related to "${topic}":\n\n` +
        list.map((d) => `- ${d.summary}`).join("\n");

      return createMcpResponse(
        JSON.stringify({
          summary,
          related_decisions: list,
          last_updated: new Date().toISOString(),
        })
      );
    }

    // ─── explain_file ──────────────────────────────────────────
    case "explain_file": {
      const { path } = ExplainFileSchema.parse(args);

      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, project_id, summary, reasoning, source, related_files, created_at")
        .eq("project_id", projectId)
        .contains("related_files", [path])
        .order("created_at", { ascending: false })
        .limit(5);

      const list = decisions || [];

      // Check if file has ever appeared in any change record
      const { data: changeMatch } = await supabase
        .from("changes")
        .select("id")
        .eq("project_id", projectId)
        .ilike("summary", `%${path}%`)
        .limit(1);

      const fileExists = list.length > 0 || (changeMatch && changeMatch.length > 0);

      let summary: string;
      if (list.length > 0) {
        summary = `Decisions involving "${path}":\n\n` +
          list.map((d) => `- ${d.summary}`).join("\n");
      } else {
        summary = "No decisions recorded for this file.";
      }

      return createMcpResponse(
        JSON.stringify({
          summary,
          related_decisions: list,
          file_exists_in_repo: fileExists,
        })
      );
    }

    // ─── recent_changes ────────────────────────────────────────
    case "recent_changes": {
      const { since } = RecentChangesSchema.parse(args);
      const sinceIso = parseSince(since);

      const [changesRes, decisionsRes] = await Promise.all([
        supabase
          .from("changes")
          .select("id, project_id, summary, commit_sha, created_at")
          .eq("project_id", projectId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("decisions")
          .select("id, project_id, summary, reasoning, source, related_files, created_at")
          .eq("project_id", projectId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const changes = changesRes.data || [];
      const decisions = decisionsRes.data || [];
      const truncated = changes.length === 20;

      const response: Record<string, unknown> = {
        changes,
        decisions,
      };

      if (truncated) {
        response._note = "Changes truncated at 20 entries. Use a narrower time window for more precision.";
      }

      return createMcpResponse(JSON.stringify(response));
    }

    // ─── log_decision ──────────────────────────────────────────
    case "log_decision": {
      const parsed = LogDecisionSchema.parse(args);

      if (!parsed.summary.trim() || !parsed.reasoning.trim()) {
        throw new McpError(ErrorCode.InvalidRequest, "Both summary and reasoning are required and cannot be empty.");
      }

      const { data, error } = await supabase
        .from("decisions")
        .insert({
          project_id: projectId,
          summary: parsed.summary.trim(),
          reasoning: parsed.reasoning.trim(),
          source: "agent_logged",
          related_files: parsed.related_files || [],
        })
        .select("id, created_at")
        .single();

      if (error) {
        throw new McpError(ErrorCode.InternalError, `Failed to log decision: ${error.message}`);
      }

      return createMcpResponse(
        JSON.stringify({
          id: data.id,
          created_at: data.created_at,
        })
      );
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Contextly MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
