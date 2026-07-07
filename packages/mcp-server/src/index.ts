import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import {
  GetContextArgs,
  ExplainFileArgs,
  RecentChangesArgs,
  LogDecisionArgs,
  MCP_SERVER_INFO
} from "@contextly/shared";

const server = new Server(
  {
    name: MCP_SERVER_INFO.NAME,
    version: MCP_SERVER_INFO.VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_context",
        description: "Get the current project context or brief for a specific topic",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Optional topic to focus on" },
          },
        },
      },
      {
        name: "explain_file",
        description: "Get the architectural history and decisions related to a specific file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to the file" },
          },
          required: ["path"],
        },
      },
      {
        name: "recent_changes",
        description: "Get a summary of recent changes and decisions",
        inputSchema: {
          type: "object",
          properties: {
            since: { type: "string", description: "ISO date string to filter changes since" },
          },
        },
      },
      {
        name: "log_decision",
        description: "Log a significant architectural or project decision",
        inputSchema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "One-line summary" },
            reasoning: { type: "string", description: "The 'why' behind it" },
            relatedFiles: { type: "array", items: { type: "string" } },
          },
          required: ["summary"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_context":
        // TODO: Implement Supabase fetch
        return { content: [{ type: "text", text: "Context fetch not implemented yet." }] };

      case "explain_file":
        // TODO: Implement Supabase fetch
        return { content: [{ type: "text", text: "File explanation not implemented yet." }] };

      case "recent_changes":
        // TODO: Implement Supabase fetch
        return { content: [{ type: "text", text: "Recent changes not implemented yet." }] };

      case "log_decision":
        // TODO: Implement Supabase insert
        return { content: [{ type: "text", text: "Decision logged (mock)." }] };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
