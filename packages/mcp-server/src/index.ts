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

/**
 * ELITE CTO SCALING: Database-level rate limiting
 */
async function enforceRateLimit(projectId: string) {
  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_key: `mcp_query_${projectId}`,
    p_limit: 100, // 100 queries per minute
    p_window: "1 minute"
  });

  if (error) console.error("Rate limit check failed", error);
  if (!allowed) throw new McpError(ErrorCode.InvalidRequest, "Rate limit exceeded. Slow down, architect.");
}

const server = new Server(
  { name: MCP_SERVER_INFO.NAME, version: MCP_SERVER_INFO.VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_project_intelligence",
      description: "High-level summary of project memory and architectural health.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "query_decisions",
      description: "Search the architectural decision log with high-performance indexing.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          path: { type: "string" }
        }
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

  // Enforce scaling protection
  await enforceRateLimit(projectId);

  switch (name) {
    case "health_check":
      return { content: [{ type: "text", text: "Contextly MCP Server: Scaling-Ready ◈ Online." }] };

    case "get_project_intelligence": {
      // SCALING OPTIMIZATION: Use stats table and composite indexes
      const [statsRes, decisionsRes] = await Promise.all([
        supabase.from("project_stats").select("*").eq("project_id", projectId).single(),
        supabase.from("decisions").select("summary, source, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(10)
      ]);

      const stats = statsRes.data;
      const decisions = decisionsRes.data || [];

      let output = `## Project Architecture Overview\n`;
      output += `- **Integrity Status**: ${stats ? 'Healthy' : 'Initializing'}\n`;
      output += `- **Memory Depth**: ${stats?.decision_count || 0} decisions across ${stats?.change_count || 0} git cycles.\n\n`;

      output += `### Recent Architectural Pulse:\n`;
      output += decisions.map(d => `- [${d.source === 'git_commit' ? 'SYNC' : 'LOG'}] ${d.summary}`).join("\n");

      return { content: [{ type: "text", text: output }] };
    }

    case "query_decisions": {
      const { query, path } = args as { query?: string, path?: string };

      // SCALING OPTIMIZATION: Filter using indexed columns
      let dbQuery = supabase.from("decisions").select("*").eq("project_id", projectId).order("created_at", { ascending: false });

      if (query) dbQuery = dbQuery.ilike("summary", `%${query}%`);
      if (path) dbQuery = dbQuery.contains("related_files", [path]);

      const { data } = await dbQuery.limit(5);
      const text = data?.map(d => `### ${d.summary}\n${d.reasoning}`).join("\n\n") || "No matching decisions found.";
      return { content: [{ type: "text", text }] };
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
