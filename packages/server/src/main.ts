#!/usr/bin/env node

/**
 * GoTN MCP Server Entry Point
 *
 * This is the main entry point for the GoTN (Graph of Tiny Nodes) MCP server.
 * It exposes tools for breaking down prompts into micro-prompts and managing
 * dependency graphs with semantic search capabilities.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "gotn-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Log to stderr so it doesn't interfere with MCP protocol on stdout
const log = (message: string) => {
  console.error(`[GoTN] ${message}`);
};

// Tool definitions
const GOTN_TOOLS = [
  {
    name: "gotn_index_workspace",
    description: "Creates .gotn and seeds minimal nodes",
    inputSchema: {
      type: "object",
      properties: {
        workspace_path: {
          type: "string",
          description: "Path to the workspace to index",
        },
      },
      required: ["workspace_path"],
    },
  },
  {
    name: "gotn_store_node",
    description: "Validates and persists a node and its embedding",
    inputSchema: {
      type: "object",
      properties: {
        node: {
          type: "object",
          description: "Node data to store",
        },
      },
      required: ["node"],
    },
  },
  {
    name: "gotn_infer_edges",
    description: "Creates hard and soft edges with evidence",
    inputSchema: {
      type: "object",
      properties: {
        node_id: {
          type: "string",
          description: "ID of node to infer edges for",
        },
      },
      required: ["node_id"],
    },
  },
  {
    name: "gotn_compose_plan",
    description: "Produces a safe ordered plan and writes a run folder",
    inputSchema: {
      type: "object",
      properties: {
        target_nodes: {
          type: "array",
          items: { type: "string" },
          description: "Node IDs to include in the plan",
        },
      },
      required: ["target_nodes"],
    },
  },
  {
    name: "gotn_execute_node",
    description: "Evaluates guards then writes a patch stub when proceeding",
    inputSchema: {
      type: "object",
      properties: {
        node_id: {
          type: "string",
          description: "ID of node to execute",
        },
      },
      required: ["node_id"],
    },
  },
  {
    name: "gotn_trace_node",
    description:
      "Returns parents, children, requires, produces and edge proofs",
    inputSchema: {
      type: "object",
      properties: {
        node_id: {
          type: "string",
          description: "ID of node to trace",
        },
      },
      required: ["node_id"],
    },
  },
] as const;

// Register list tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log(`Listing ${GOTN_TOOLS.length} registered tools`);
  return {
    tools: GOTN_TOOLS,
  };
});

// Register call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  log(`Tool called: ${name} with args: ${JSON.stringify(args)}`);

  // For now, all tools return a static success response
  const result = {
    ok: true,
    tool: name,
    message: `Tool ${name} executed successfully`,
    timestamp: new Date().toISOString(),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  log("🚀 GoTN MCP Server starting...");
  log(`Registering ${GOTN_TOOLS.length} tools:`);

  GOTN_TOOLS.forEach((tool) => {
    log(`  - ${tool.name}: ${tool.description}`);
  });

  await server.connect(transport);
  log("✅ Server connected and ready");
}

main().catch((error) => {
  log(`❌ Server error: ${error}`);
  process.exit(1);
});
