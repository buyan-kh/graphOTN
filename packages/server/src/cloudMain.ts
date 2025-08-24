#!/usr/bin/env node

/**
 * GoTN Cloud-First MCP Server
 *
 * Pure cloud architecture - no local filesystem dependencies
 * Everything stored in Zilliz with project_id isolation
 * Global service that works from anywhere
 */

// Load environment variables from project root .env file
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..", "..");

try {
  const envPath = join(projectRoot, ".env");
  const envContent = readFileSync(envPath, "utf8");

  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file not found or not readable - this is okay
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getCloudStore,
  CloudStore,
  getCloudBreakdownEngine,
  CloudBreakdownEngine,
} from "@gotn/core";

const server = new Server(
  {
    name: "gotn-cloud-server",
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
  console.error(`[GoTN Cloud] ${message}`);
};

// Cloud-first tool definitions
const GOTN_CLOUD_TOOLS = [
  {
    name: "gotn_init_project",
    description: "Initialize a new GoTN project in the cloud",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description:
            "Unique identifier for the project (e.g., 'my-react-app', 'data-pipeline')",
        },
        project_name: {
          type: "string",
          description: "Human-readable name for the project (optional)",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "gotn_breakdown_prompt",
    description:
      "Break down a large prompt into atomic micro-prompts stored in the cloud",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project identifier for the breakdown",
        },
        prompt: {
          type: "string",
          description: "The large prompt to break down into micro prompts",
        },
        mode: {
          type: "string",
          enum: ["tree", "flat"],
          description: "Breakdown mode: tree (hierarchical) or flat (linear)",
          default: "tree",
        },
        max_nodes: {
          type: "number",
          description: "Maximum number of nodes to create",
          default: 16,
        },
      },
      required: ["project_id", "prompt"],
    },
  },
  {
    name: "gotn_get_graph",
    description: "Retrieve the complete graph for a project from the cloud",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project identifier",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "gotn_search_nodes",
    description:
      "Search nodes by text using semantic similarity within a project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project identifier",
        },
        query: {
          type: "string",
          description: "Text query to search for",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10)",
          default: 10,
        },
      },
      required: ["project_id", "query"],
    },
  },
  {
    name: "gotn_list_projects",
    description: "List all available projects",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
] as const;

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: GOTN_CLOUD_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "gotn_init_project":
        return await handleInitProject(
          args as { project_id: string; project_name?: string }
        );

      case "gotn_breakdown_prompt":
        return await handleBreakdownPrompt(
          args as {
            project_id: string;
            prompt: string;
            mode?: "tree" | "flat";
            max_nodes?: number;
          }
        );

      case "gotn_get_graph":
        return await handleGetGraph(args as { project_id: string });

      case "gotn_search_nodes":
        return await handleSearchNodes(
          args as {
            project_id: string;
            query: string;
            limit?: number;
          }
        );

      case "gotn_list_projects":
        return await handleListProjects();

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    log(
      `Tool ${name} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
});

// Tool handlers
async function handleInitProject(args: {
  project_id: string;
  project_name?: string;
}) {
  log(`Initializing cloud project: ${args.project_id}`);

  const cloudStore = getCloudStore();

  // For now, just verify we can access the cloud store
  // In the future, we might store project metadata

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: true,
            tool: "gotn_init_project",
            message: "Project initialized in cloud",
            project_id: args.project_id,
            project_name: args.project_name || args.project_id,
            storage: "cloud",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleBreakdownPrompt(args: {
  project_id: string;
  prompt: string;
  mode?: "tree" | "flat";
  max_nodes?: number;
}) {
  log(`Breaking down prompt for project: ${args.project_id}`);
  log(`Prompt: "${args.prompt.substring(0, 100)}..."`);

  const cloudStore = getCloudStore();
  const breakdownEngine = getCloudBreakdownEngine();

  try {
    // Use breakdown engine with cloud storage
    const result = await breakdownEngine.breakdown({
      project_id: args.project_id,
      prompt: args.prompt,
      mode: args.mode || "tree",
      max_nodes: args.max_nodes || 16,
    });

    // Store all nodes in cloud
    for (const node of result.nodes) {
      await cloudStore.storeNode(node, args.project_id);
    }

    // Store all edges in cloud
    for (const edge of result.edges) {
      await cloudStore.storeEdge(edge, args.project_id);
    }

    log(
      `Stored ${result.nodes.length} nodes and ${result.edges.length} edges in cloud`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              tool: "gotn_breakdown_prompt",
              message: "Prompt broken down and stored in cloud",
              project_id: args.project_id,
              nodes_created: result.nodes.length,
              edges_created: result.edges.length,
              root_id: result.root_id,
              storage: "cloud",
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    log(
      `Breakdown failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: false,
              tool: "gotn_breakdown_prompt",
              error: error instanceof Error ? error.message : String(error),
              project_id: args.project_id,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}

async function handleGetGraph(args: { project_id: string }) {
  log(`Getting graph for project: ${args.project_id}`);

  const cloudStore = getCloudStore();
  const graph = await cloudStore.getGraph(args.project_id);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: true,
            tool: "gotn_get_graph",
            project_id: args.project_id,
            graph,
            nodes_count: graph.nodes.length,
            edges_count: graph.edges.length,
            storage: "cloud",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleSearchNodes(args: {
  project_id: string;
  query: string;
  limit?: number;
}) {
  log(`Searching nodes in project ${args.project_id}: "${args.query}"`);

  const cloudStore = getCloudStore();
  const nodes = await cloudStore.searchNodes(
    args.query,
    args.project_id,
    args.limit || 10
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: true,
            tool: "gotn_search_nodes",
            project_id: args.project_id,
            query: args.query,
            results: nodes,
            count: nodes.length,
            storage: "cloud",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleListProjects() {
  log("Listing all projects");

  const cloudStore = getCloudStore();
  const projects = await cloudStore.listProjects();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: true,
            tool: "gotn_list_projects",
            projects,
            count: projects.length,
            storage: "cloud",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  log("🌥️  GoTN Cloud MCP Server starting...");
  log(`Registering ${GOTN_CLOUD_TOOLS.length} cloud-first tools:`);

  GOTN_CLOUD_TOOLS.forEach((tool) => {
    log(`  - ${tool.name}: ${tool.description}`);
  });

  await server.connect(transport);
  log("✅ Cloud server connected and ready");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log(`❌ Server failed to start: ${error}`);
    process.exit(1);
  });
}
