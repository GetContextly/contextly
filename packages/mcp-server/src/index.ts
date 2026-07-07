import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "contextly-server",
    version: "0.1.0",
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
