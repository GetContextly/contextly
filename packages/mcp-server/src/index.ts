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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedProjectId: string | null = null;

async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId;
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("mcp_token", CONTEXTLY_TOKEN)
    .single();

  if (error || !data) throw new McpError(ErrorCode.InvalidRequest, `Invalid Token.`);
  cachedProjectId = data.id;
  return data.id;
}

const server = new Server(
  { name: MCP_SERVER_INFO.NAME, version: MCP_SERVER_INFO.VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_project_intelligence",
      description: "Get a high-level executive summary of project architecture and recent major decisions.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "query_decisions",
      description: "Search the architectural decision log by keyword or file path.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          path: { type: "string" }
        }
      },
    },
    {
      name: "log_decision",
      description: "Manually log a significant decision. Critical when the agent makes a choice that isn't reflected in a single commit.",
      inputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          reasoning: { type: "string" },
          related_files: { type: "array", items: { type: "string" } }
        },
        required: ["summary", "reasoning"]
      },
    },
    {
      name: "health_check",
      description: "Verify server connection and token validity.",
      inputSchema: { type: "object", properties: {} },
    }
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const projectId = await getProjectId();

  switch (name) {
    case "health_check":
      return { content: [{ type: "text", text: "Contextly MCP Server: Online ◈ Ready for queries." }] };

    case "get_project_intelligence": {
      const { data: decisions } = await supabase
        .from("decisions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!decisions || decisions.length === 0) {
        return { content: [{ type: "text", text: "Project has no recorded memory yet." }] };
      }

      const summary = decisions.map(d => `- [${d.source}] ${d.summary}: ${d.reasoning?.substring(0, 100)}...`).join("\n");
      return {
        content: [{
          type: "text",
          text: `## Executive Project Summary\n\nRecent Architectural Evolution:\n${summary}\n\nMaintain context by checking these specific files if relevant: ${[...new Set(decisions.flatMap(d => d.related_files || []))].slice(0, 10).join(", ")}`
        }]
      };
    }

    case "query_decisions": {
      const { query, path } = args as { query?: string, path?: string };
      let dbQuery = supabase.from("decisions").select("*").eq("project_id", projectId);

      if (query) dbQuery = dbQuery.ilike("summary", `%${query}%`);
      if (path) dbQuery = dbQuery.contains("related_files", [path]);

      const { data } = await dbQuery.limit(5);
      const text = data?.map(d => `### ${d.summary}\n${d.reasoning}`).join("\n\n") || "No matching decisions found.";
      return { content: [{ type: "text", text }] };
    }

    case "log_decision": {
      const { summary, reasoning, related_files } = args as any;
      const { data, error } = await supabase.from("decisions").insert({
        project_id: projectId,
        summary,
        reasoning,
        related_files,
        source: "agent_logged"
      }).select().single();

      if (error) throw error;
      return { content: [{ type: "text", text: `Stored decision: ${data.id}` }] };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
