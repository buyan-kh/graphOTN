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
import {
  initStore,
  readGraph,
  isInitialized,
  appendJournal,
  recoverFromJournal,
  addNode,
} from "@gotn/core";

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
        workspace_path: {
          type: "string",
          description:
            "Path to the workspace (optional, defaults to current directory)",
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

  try {
    let result: any;

    switch (name) {
      case "gotn_index_workspace":
        result = await handleIndexWorkspace(args as { workspace_path: string });
        break;

      case "gotn_store_node":
        result = await handleStoreNode(
          args as { node: any; workspace_path?: string }
        );
        break;

      case "gotn_infer_edges":
        result = await handleInferEdges(args as { node_id: string });
        break;

      case "gotn_compose_plan":
        result = await handleComposePlan(args as { target_nodes: string[] });
        break;

      case "gotn_execute_node":
        result = await handleExecuteNode(args as { node_id: string });
        break;

      case "gotn_trace_node":
        result = await handleTraceNode(args as { node_id: string });
        break;

      default:
        result = {
          ok: false,
          error: `Unknown tool: ${name}`,
          timestamp: new Date().toISOString(),
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    log(`Tool ${name} failed: ${error.message}`);

    const errorResult = {
      ok: false,
      tool: name,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(errorResult, null, 2),
        },
      ],
    };
  }
});

// Tool handler implementations
async function handleIndexWorkspace(args: { workspace_path: string }) {
  const { workspace_path } = args;

  log(`Initializing workspace: ${workspace_path}`);

  // Check if already initialized
  const alreadyInitialized = await isInitialized(workspace_path);

  if (alreadyInitialized) {
    log(`Workspace already initialized: ${workspace_path}`);

    // Check if graph.json exists and is valid, recover if needed
    try {
      const graph = await readGraph(workspace_path);

      return {
        ok: true,
        tool: "gotn_index_workspace",
        message: "Workspace already initialized",
        workspace_path,
        nodes_count: graph.nodes.length,
        edges_count: graph.edges.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      log(`Graph corrupted or missing, attempting recovery: ${error.message}`);

      // Attempt recovery from journal
      try {
        await recoverFromJournal(workspace_path);
        log(`Successfully recovered graph from journal`);

        const recoveredGraph = await readGraph(workspace_path);

        return {
          ok: true,
          tool: "gotn_index_workspace",
          message: "Workspace recovered from journal",
          workspace_path,
          nodes_count: recoveredGraph.nodes.length,
          edges_count: recoveredGraph.edges.length,
          recovery_performed: true,
          timestamp: new Date().toISOString(),
        };
      } catch (recoveryError: any) {
        log(`Recovery failed: ${recoveryError.message}`);
        throw new Error(
          `Workspace corrupted and recovery failed: ${recoveryError.message}`
        );
      }
    }
  }

  // Initialize the .gotn structure
  await initStore(workspace_path);

  // Ensure recovery is available after initialization
  try {
    await recoverFromJournal(workspace_path);
    log(`Post-initialization recovery check completed`);
  } catch (error: any) {
    // Recovery after fresh init should not fail, but don't block initialization
    log(
      `Post-initialization recovery check failed (non-critical): ${error.message}`
    );
  }

  // Log the initialization
  await appendJournal(workspace_path, {
    event: "workspace_initialized",
    data: { workspace_path },
  });

  log(`Successfully initialized workspace: ${workspace_path}`);

  return {
    ok: true,
    tool: "gotn_index_workspace",
    message: "Workspace initialized successfully",
    workspace_path,
    structure_created: [
      ".gotn/",
      ".gotn/meta.json",
      ".gotn/graph.json",
      ".gotn/journal.ndjson",
      ".gotn/locks/",
      ".gotn/runs/",
      ".gotn/cache/",
    ],
    timestamp: new Date().toISOString(),
  };
}

async function handleStoreNode(args: { node: any; workspace_path?: string }) {
  const { node, workspace_path } = args;

  // Use current directory as default workspace if not provided
  const workspacePath = workspace_path || process.cwd();

  log(`Storing node: ${JSON.stringify(node)} in workspace: ${workspacePath}`);

  try {
    // Ensure workspace is initialized
    if (!(await isInitialized(workspacePath))) {
      throw new Error(
        "Workspace not initialized. Run gotn_index_workspace first."
      );
    }

    // Add node to graph with journal logging
    await addNode(workspacePath, node);

    log(`Successfully stored node: ${node.id}`);

    return {
      ok: true,
      tool: "gotn_store_node",
      message: "Node stored successfully",
      node_id: node.id,
      workspace_path: workspacePath,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    log(`Failed to store node: ${error.message}`);
    throw error;
  }
}

async function handleInferEdges(args: { node_id: string }) {
  // Placeholder - will be implemented in next step
  return {
    ok: true,
    tool: "gotn_infer_edges",
    message: "Edge inference not yet implemented",
    timestamp: new Date().toISOString(),
  };
}

async function handleComposePlan(args: { target_nodes: string[] }) {
  // Placeholder - will be implemented in next step
  return {
    ok: true,
    tool: "gotn_compose_plan",
    message: "Plan composition not yet implemented",
    timestamp: new Date().toISOString(),
  };
}

async function handleExecuteNode(args: { node_id: string }) {
  // Placeholder - will be implemented in next step
  return {
    ok: true,
    tool: "gotn_execute_node",
    message: "Node execution not yet implemented",
    timestamp: new Date().toISOString(),
  };
}

async function handleTraceNode(args: { node_id: string }) {
  // Placeholder - will be implemented in next step
  return {
    ok: true,
    tool: "gotn_trace_node",
    message: "Node tracing not yet implemented",
    timestamp: new Date().toISOString(),
  };
}

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
