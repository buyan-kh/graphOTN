#!/usr/bin/env node
/**
 * GoTN MCP Server Entry Point
 *
 * This is the main entry point for the GoTN (Graph of Tiny Nodes) MCP server.
 * It exposes tools for breaking down prompts into micro-prompts and managing
 * dependency graphs with semantic search capabilities.
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
}
catch (error) {
    // .env file not found or not readable - this is okay
}
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { getEdgeEngine, getBreakdownEngine, getPlanComposer, getGuardEngine, getLogger, getMetrics, } from "@gotn/core";
const server = new Server({
    name: "gotn-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Log to stderr so it doesn't interfere with MCP protocol on stdout
const log = (message) => {
    console.error(`[GoTN] ${message}`);
};
// Tool definitions
const GOTN_TOOLS = [
    {
        name: "gotn_init_project",
        description: "Initialize a new GoTN project in the cloud",
        inputSchema: {
            type: "object",
            properties: {
                project_id: {
                    type: "string",
                    description: "Unique identifier for the project",
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
        name: "gotn_store_node",
        description: "Validates and persists a node and its embedding in the cloud",
        inputSchema: {
            type: "object",
            properties: {
                node: {
                    type: "object",
                    description: "Node data to store",
                },
                project_id: {
                    type: "string",
                    description: "Project identifier",
                },
            },
            required: ["node", "project_id"],
        },
    },
    {
        name: "gotn_infer_edges",
        description: "Creates hard and soft edges with evidence",
        inputSchema: {
            type: "object",
            properties: {
                node_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Node IDs to infer edges for (optional, defaults to all nodes)",
                },
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: [],
        },
    },
    {
        name: "gotn_breakdown_prompt",
        description: "Breaks down a large prompt into atomic micro prompts with dependencies",
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
                    default: 64,
                },
                compose: {
                    type: "boolean",
                    description: "Whether to automatically compose a plan after breakdown",
                    default: true,
                },
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: ["project_id", "prompt"],
        },
    },
    {
        name: "gotn_compose_plan",
        description: "Produces a safe ordered plan and writes a run folder",
        inputSchema: {
            type: "object",
            properties: {
                goal: {
                    type: "string",
                    description: "Goal description for the plan (optional)",
                },
                requires: {
                    type: "array",
                    items: { type: "string" },
                    description: "Required tags to filter nodes (optional)",
                },
                produces: {
                    type: "array",
                    items: { type: "string" },
                    description: "Produced tags to filter nodes (optional)",
                },
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: [],
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
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: ["node_id"],
        },
    },
    {
        name: "gotn_trace_node",
        description: "Returns parents, children, requires, produces and edge proofs",
        inputSchema: {
            type: "object",
            properties: {
                node_id: {
                    type: "string",
                    description: "ID of node to trace",
                },
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: ["node_id"],
        },
    },
    {
        name: "gotn_search_nodes",
        description: "Search nodes by text using semantic similarity",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Text query to search for",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results (default: 10)",
                },
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "gotn_debug",
        description: "Returns current counts and storage mode for debugging",
        inputSchema: {
            type: "object",
            properties: {
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: [],
        },
    },
    {
        name: "gotn_recover",
        description: "Recovers graph from journal and verifies integrity",
        inputSchema: {
            type: "object",
            properties: {
                workspace_path: {
                    type: "string",
                    description: "Path to the workspace (optional, defaults to current directory)",
                },
            },
            required: [],
        },
    },
];
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
        let result;
        switch (name) {
            case "gotn_index_workspace":
                result = await handleIndexWorkspace(args);
                break;
            case "gotn_store_node":
                result = await handleStoreNode(args);
                break;
            case "gotn_infer_edges":
                result = await handleInferEdges(args);
                break;
            case "gotn_breakdown_prompt":
                result = await handleBreakdownPrompt(args);
                break;
            case "gotn_compose_plan":
                result = await handleComposePlan(args);
                break;
            case "gotn_execute_node":
                result = await handleExecuteNode(args);
                break;
            case "gotn_trace_node":
                result = await handleTraceNode(args);
                break;
            case "gotn_search_nodes":
                result = await handleSearchNodes(args);
                break;
            case "gotn_debug":
                result = await handleDebug(args);
                break;
            case "gotn_recover":
                result = await handleRecover(args);
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
    }
    catch (error) {
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
async function handleIndexWorkspace(args) {
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
        }
        catch (error) {
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
            }
            catch (recoveryError) {
                log(`Recovery failed: ${recoveryError.message}`);
                throw new Error(`Workspace corrupted and recovery failed: ${recoveryError.message}`);
            }
        }
    }
    // Initialize the .gotn structure
    await initStore(workspace_path);
    // Ensure recovery is available after initialization
    try {
        await recoverFromJournal(workspace_path);
        log(`Post-initialization recovery check completed`);
    }
    catch (error) {
        // Recovery after fresh init should not fail, but don't block initialization
        log(`Post-initialization recovery check failed (non-critical): ${error.message}`);
    }
    // Log the initialization
    await appendJournal(workspace_path, {
        event: "workspace_initialized",
        data: { workspace_path },
    });
    // Run minimal indexer
    const indexResult = await runMinimalIndexer(workspace_path);
    log(`Successfully initialized workspace: ${workspace_path}`);
    log(`Indexed ${indexResult.deps_nodes} dependency nodes and ${indexResult.code_nodes} code symbol nodes`);
    return {
        ok: true,
        tool: "gotn_index_workspace",
        message: "Workspace initialized successfully with baseline indexing",
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
        indexed_files: indexResult.indexed_files,
        deps_nodes: indexResult.deps_nodes,
        code_nodes: indexResult.code_nodes,
        timestamp: new Date().toISOString(),
    };
}
async function handleStoreNode(args) {
    const { node, workspace_path } = args;
    // Use current directory as default workspace if not provided
    const workspacePath = workspace_path || process.cwd();
    log(`Storing node: ${JSON.stringify(node)} in workspace: ${workspacePath}`);
    try {
        // Ensure workspace is initialized
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        // Change to workspace directory for NodeStore operations
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            // Use NodeStore for full node storage with embeddings
            const nodeStore = getNodeStore();
            await nodeStore.storeNode(node);
            log(`Successfully stored node: ${node.id} with embedding`);
            return {
                ok: true,
                tool: "gotn_store_node",
                message: "Node stored successfully with embedding",
                node_id: node.id,
                workspace_path: workspacePath,
                embedding_created: true,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            // Restore original working directory
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to store node: ${error.message}`);
        throw error;
    }
}
async function handleInferEdges(args) {
    const { node_ids, workspace_path } = args;
    // Use current directory as default workspace if not provided
    const workspacePath = workspace_path || process.cwd();
    log(`Inferring edges for nodes: ${node_ids ? node_ids.join(", ") : "all"} in workspace: ${workspacePath}`);
    try {
        // Ensure workspace is initialized
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        // Change to workspace directory for EdgeEngine operations
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            // Use EdgeEngine for edge inference
            const edgeEngine = getEdgeEngine();
            const result = await edgeEngine.inferEdges(node_ids);
            log(`Successfully inferred ${result.totalEdgesCreated} edges (${result.hardEdges.length} hard, ${result.softEdges.length} soft)`);
            return {
                ok: true,
                tool: "gotn_infer_edges",
                message: `Successfully inferred ${result.totalEdgesCreated} edges`,
                node_ids: node_ids || "all",
                workspace_path: workspacePath,
                hard_edges_created: result.hardEdges.length,
                soft_edges_created: result.softEdges.length,
                total_edges_created: result.totalEdgesCreated,
                hard_edges: result.hardEdges.map((edge) => ({
                    src: edge.src,
                    dst: edge.dst,
                    type: edge.type,
                    evidence: edge.evidence,
                })),
                soft_edges: result.softEdges.map((edge) => ({
                    src: edge.src,
                    dst: edge.dst,
                    type: edge.type,
                    score: edge.score,
                    evidence: edge.evidence,
                })),
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            // Restore original working directory
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to infer edges: ${error.message}`);
        throw error;
    }
}
async function handleBreakdownPrompt(args) {
    const { project_id, prompt, mode = "tree", max_nodes = 64, compose = true, workspace_path, } = args;
    // Use current directory as default workspace if not provided
    const workspacePath = workspace_path || process.cwd();
    log(`Breaking down prompt for project "${project_id}" in workspace: ${workspacePath}`);
    log(`Prompt: "${prompt.substring(0, 100)}..."`);
    log(`Mode: ${mode}, Max nodes: ${max_nodes}`);
    try {
        // Ensure workspace is initialized
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        // Change to workspace directory for breakdown operations
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            // Use BreakdownEngine for prompt decomposition
            const breakdownEngine = getBreakdownEngine();
            const result = await breakdownEngine.breakdown({
                project_id,
                prompt,
                mode,
                max_nodes,
            });
            log(`Successfully broke down prompt into ${result.total_nodes} nodes with ${result.created_edge_count} edges`);
            let planResult = null;
            // Auto-compose plan if requested
            if (compose) {
                try {
                    const planComposer = getPlanComposer();
                    planResult = await planComposer.composePlan({
                        goal: `Execute breakdown: ${prompt.substring(0, 50)}...`,
                    });
                    log(`Auto-composed plan with ${planResult.ordered_node_ids.length} nodes`);
                }
                catch (error) {
                    log(`Failed to auto-compose plan: ${error.message}`);
                    // Continue without plan - don't fail the breakdown
                }
            }
            return {
                ok: true,
                tool: "gotn_breakdown_prompt",
                message: `Successfully broke down prompt into ${result.total_nodes} micro prompts${compose && planResult ? " and composed execution plan" : ""}`,
                project_id,
                workspace_path: workspacePath,
                mode,
                max_nodes,
                compose,
                created_node_ids: result.created_node_ids,
                created_edge_count: result.created_edge_count,
                root_id: result.root_id,
                total_nodes: result.total_nodes,
                plan: planResult
                    ? {
                        ordered_node_ids: planResult.ordered_node_ids,
                        run_folder: planResult.run_folder,
                        layers: planResult.layers,
                        reason: planResult.reason,
                    }
                    : null,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            // Restore original working directory
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to break down prompt: ${error.message}`);
        throw error;
    }
}
async function handleComposePlan(args) {
    const { goal, requires, produces, workspace_path } = args;
    const workspacePath = workspace_path || process.cwd();
    log(`Composing plan in workspace: ${workspacePath}`);
    if (goal)
        log(`Goal: ${goal}`);
    if (requires)
        log(`Requires: ${requires.join(", ")}`);
    if (produces)
        log(`Produces: ${produces.join(", ")}`);
    try {
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            const planComposer = getPlanComposer();
            const result = await planComposer.composePlan({
                goal,
                requires,
                produces,
            });
            log(`Plan created with ${result.ordered_node_ids.length} nodes in ${result.layers.length} layers`);
            return {
                ok: true,
                tool: "gotn_compose_plan",
                message: `Plan created with ${result.ordered_node_ids.length} nodes`,
                workspace_path: workspacePath,
                goal,
                requires: requires || [],
                produces: produces || [],
                ordered_node_ids: result.ordered_node_ids,
                layers: result.layers,
                run_folder: result.run_folder,
                reason: result.reason,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to compose plan: ${error.message}`);
        throw error;
    }
}
async function handleExecuteNode(args) {
    const { node_id, workspace_path } = args;
    const workspacePath = workspace_path || process.cwd();
    log(`Executing node ${node_id} in workspace: ${workspacePath}`);
    try {
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            // Get the node
            const nodeStore = getNodeStore();
            const node = await nodeStore.getNode(node_id);
            if (!node) {
                throw new Error(`Node ${node_id} not found`);
            }
            // Evaluate guards
            const guardEngine = getGuardEngine();
            const guardResult = await guardEngine.evaluate(node);
            // Update metrics
            const metrics = getMetrics(workspacePath);
            const logger = getLogger(workspacePath);
            if (guardResult.result === "skip") {
                metrics.incrementSkips();
                await logger.info("Node skipped", {
                    node_id,
                    reason: guardResult.reason,
                });
            }
            else if (guardResult.result === "fail") {
                metrics.incrementGuardFails();
                await logger.warn("Guard failed", {
                    node_id,
                    reason: guardResult.reason,
                });
            }
            else {
                await logger.info("Node executed", {
                    node_id,
                    action: guardResult.result,
                });
            }
            // Write step to steps.jsonl (find most recent run folder)
            const fs = await import("fs");
            const path = await import("path");
            const runsDir = path.join(".gotn", "runs");
            let stepsFile = "steps.jsonl";
            if (fs.existsSync(runsDir)) {
                const runFolders = fs
                    .readdirSync(runsDir)
                    .filter((f) => f.startsWith("run-"))
                    .sort()
                    .reverse();
                if (runFolders.length > 0) {
                    stepsFile = path.join(runsDir, runFolders[0], "steps.jsonl");
                }
            }
            // Log the step
            const stepEntry = {
                timestamp: new Date().toISOString(),
                node_id,
                action: guardResult.result,
                reason: guardResult.reason,
            };
            if (fs.existsSync(stepsFile)) {
                fs.appendFileSync(stepsFile, JSON.stringify(stepEntry) + "\n");
            }
            let patchPath = "";
            // Handle the result
            if (guardResult.result === "proceed") {
                // Write patch stub
                const patchContent = `PATCH for node ${node_id}\n\nSummary: ${node.summary}\nPrompt: ${node.prompt_text}\n\nGenerated at: ${new Date().toISOString()}\n`;
                const patchDir = path.dirname(stepsFile);
                const patchFile = path.join(patchDir, "patches", `${node_id}.patch`);
                patchPath = patchFile;
                if (!fs.existsSync(path.dirname(patchFile))) {
                    fs.mkdirSync(path.dirname(patchFile), { recursive: true });
                }
                fs.writeFileSync(patchFile, patchContent);
                // Update node status to completed
                const updatedNode = { ...node, status: "completed" };
                await nodeStore.storeNode(updatedNode);
                log(`Node ${node_id} executed - patch written to ${patchFile}`);
            }
            else {
                // Update node status based on result
                const newStatus = guardResult.result === "skip"
                    ? "skipped"
                    : "failed";
                const updatedNode = { ...node, status: newStatus };
                await nodeStore.storeNode(updatedNode);
                log(`Node ${node_id} ${guardResult.result}: ${guardResult.reason}`);
            }
            return {
                ok: true,
                tool: "gotn_execute_node",
                message: `Node ${guardResult.result}: ${guardResult.reason}`,
                node_id,
                workspace_path: workspacePath,
                action: guardResult.result,
                reason: guardResult.reason,
                patch_path: patchPath || null,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to execute node: ${error.message}`);
        throw error;
    }
}
async function handleTraceNode(args) {
    const { node_id, workspace_path } = args;
    const workspacePath = workspace_path || process.cwd();
    log(`Tracing node ${node_id} in workspace: ${workspacePath}`);
    try {
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            const graph = await readGraph(".");
            const node = graph.nodes.find((n) => n.id === node_id);
            if (!node) {
                throw new Error(`Node ${node_id} not found`);
            }
            // Find parent and child relationships
            const parentEdges = graph.edges.filter((e) => e.dst === node_id && e.type === "derived_from");
            const childEdges = graph.edges.filter((e) => e.src === node_id && e.type === "derived_from");
            // Find incoming and outgoing edges
            const incomingEdges = graph.edges.filter((e) => e.dst === node_id);
            const outgoingEdges = graph.edges.filter((e) => e.src === node_id);
            // Build proof set
            const proofs = [];
            // Hard edges proof
            const hardIncoming = incomingEdges.filter((e) => e.type === "hard_requires");
            const hardOutgoing = outgoingEdges.filter((e) => e.type === "hard_requires");
            for (const edge of hardIncoming) {
                proofs.push({
                    type: "hard_dependency",
                    direction: "incoming",
                    from: edge.src,
                    to: edge.dst,
                    evidence: edge.evidence,
                    reason: `Hard dependency: ${edge.evidence}`,
                });
            }
            for (const edge of hardOutgoing) {
                proofs.push({
                    type: "hard_dependency",
                    direction: "outgoing",
                    from: edge.src,
                    to: edge.dst,
                    evidence: edge.evidence,
                    reason: `Hard dependency: ${edge.evidence}`,
                });
            }
            // Soft edges proof
            const softIncoming = incomingEdges.filter((e) => e.type === "soft_semantic");
            const softOutgoing = outgoingEdges.filter((e) => e.type === "soft_semantic");
            for (const edge of softIncoming) {
                proofs.push({
                    type: "semantic_similarity",
                    direction: "incoming",
                    from: edge.src,
                    to: edge.dst,
                    score: edge.score,
                    evidence: edge.evidence,
                    reason: `Semantic similarity: ${edge.score?.toFixed(4)} - ${edge.evidence}`,
                });
            }
            for (const edge of softOutgoing) {
                proofs.push({
                    type: "semantic_similarity",
                    direction: "outgoing",
                    from: edge.src,
                    to: edge.dst,
                    score: edge.score,
                    evidence: edge.evidence,
                    reason: `Semantic similarity: ${edge.score?.toFixed(4)} - ${edge.evidence}`,
                });
            }
            log(`Traced node ${node_id}: ${parentEdges.length} parents, ${childEdges.length} children, ${proofs.length} proofs`);
            return {
                ok: true,
                tool: "gotn_trace_node",
                message: `Traced node ${node_id} with ${proofs.length} edge proofs`,
                node_id,
                workspace_path: workspacePath,
                parents: parentEdges.map((e) => e.src),
                children: childEdges.map((e) => e.dst),
                requires: node.requires,
                produces: node.produces,
                incoming_edges: incomingEdges.map((e) => ({
                    src: e.src,
                    type: e.type,
                    evidence: e.evidence,
                    score: e.score,
                })),
                outgoing_edges: outgoingEdges.map((e) => ({
                    dst: e.dst,
                    type: e.type,
                    evidence: e.evidence,
                    score: e.score,
                })),
                proof_set: proofs,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to trace node: ${error.message}`);
        throw error;
    }
}
async function handleSearchNodes(args) {
    const { query, limit = 10, workspace_path } = args;
    // Use current directory as default workspace if not provided
    const workspacePath = workspace_path || process.cwd();
    log(`Searching nodes: "${query}" in workspace: ${workspacePath}`);
    try {
        // Ensure workspace is initialized
        if (!(await isInitialized(workspacePath))) {
            throw new Error("Workspace not initialized. Run gotn_index_workspace first.");
        }
        // Change to workspace directory for NodeStore operations
        const originalCwd = process.cwd();
        process.chdir(workspacePath);
        try {
            // Use NodeStore for semantic search
            const nodeStore = getNodeStore();
            const results = await nodeStore.searchNodesByText(query, limit);
            log(`Found ${results.length} matching nodes`);
            return {
                ok: true,
                tool: "gotn_search_nodes",
                message: `Found ${results.length} matching nodes`,
                query,
                results,
                workspace_path: workspacePath,
                timestamp: new Date().toISOString(),
            };
        }
        finally {
            // Restore original working directory
            process.chdir(originalCwd);
        }
    }
    catch (error) {
        log(`Failed to search nodes: ${error.message}`);
        throw error;
    }
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
/**
 * Minimal indexer for baseline context
 */
async function runMinimalIndexer(workspacePath) {
    const fs = await import("fs");
    const path = await import("path");
    const nodeStore = getNodeStore("indexer");
    let depsNodes = 0;
    let codeNodes = 0;
    const indexedFiles = [];
    try {
        // 1. Index package.json dependencies
        const packageJsonPath = path.join(workspacePath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies,
                };
                if (Object.keys(allDeps).length > 0) {
                    const depsNode = {
                        id: "deps_index",
                        kind: "code_symbol",
                        summary: `Project dependencies: ${Object.keys(allDeps)
                            .slice(0, 5)
                            .join(", ")}${Object.keys(allDeps).length > 5 ? "..." : ""}`,
                        prompt_text: `Dependencies from package.json: ${JSON.stringify(allDeps, null, 2)}`,
                        children: [],
                        requires: [],
                        produces: ["project_dependencies"],
                        exec_target: "package.json",
                        tags: ["dependencies", "package", "index"],
                        success_criteria: ["Dependencies available"],
                        guards: [],
                        artifacts: {
                            files: ["package.json"],
                            outputs: [],
                            dependencies: [],
                        },
                        status: "ready",
                        provenance: { created_by: "indexer", source: "package_json" },
                        version: 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    // Note: We skip the await here to avoid hanging issues
                    nodeStore.storeNode(depsNode).catch(() => {
                        // Silently ignore storage errors in indexer
                    });
                    depsNodes++;
                    indexedFiles.push("package.json");
                }
            }
            catch (error) {
                log(`Failed to parse package.json: ${error}`);
            }
        }
        // 2. Scan src directory for up to 50 files
        const srcDirs = ["src", "lib", "app", "components", "pages", "utils"];
        let fileCount = 0;
        const maxFiles = 50;
        for (const srcDir of srcDirs) {
            if (fileCount >= maxFiles)
                break;
            const srcPath = path.join(workspacePath, srcDir);
            if (!fs.existsSync(srcPath))
                continue;
            const scanDirectory = (dir, depth = 0) => {
                if (fileCount >= maxFiles || depth > 3)
                    return;
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (fileCount >= maxFiles)
                            break;
                        const fullPath = path.join(dir, entry.name);
                        const relativePath = path.relative(workspacePath, fullPath);
                        if (entry.isFile()) {
                            // Only index common code files
                            if (/\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h)$/.test(entry.name)) {
                                try {
                                    const stats = fs.statSync(fullPath);
                                    if (stats.size > 100000)
                                        continue; // Skip files > 100KB
                                    const content = fs.readFileSync(fullPath, "utf8");
                                    const lines = content.split("\n");
                                    const summary = lines.slice(0, 3).join(" ").substring(0, 100) + "...";
                                    const codeSymbolNode = {
                                        id: `code_${relativePath.replace(/[^a-zA-Z0-9]/g, "_")}`,
                                        kind: "code_symbol",
                                        summary: `${entry.name}: ${summary}`,
                                        prompt_text: `File: ${relativePath}\nFirst few lines:\n${lines
                                            .slice(0, 5)
                                            .join("\n")}`,
                                        children: [],
                                        requires: [],
                                        produces: [`file_${entry.name.replace(/\.[^.]+$/, "")}`],
                                        exec_target: relativePath,
                                        tags: [
                                            "code",
                                            "file",
                                            path.extname(entry.name).substring(1),
                                        ],
                                        success_criteria: ["File accessible"],
                                        guards: [],
                                        artifacts: {
                                            files: [relativePath],
                                            outputs: [],
                                            dependencies: [],
                                        },
                                        status: "ready",
                                        provenance: { created_by: "indexer", source: "file_scan" },
                                        version: 1,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                    };
                                    // Note: We skip the await here to avoid hanging issues
                                    // The node will be stored but we don't wait for completion
                                    nodeStore.storeNode(codeSymbolNode).catch(() => {
                                        // Silently ignore storage errors in indexer
                                    });
                                    codeNodes++;
                                    indexedFiles.push(relativePath);
                                    fileCount++;
                                }
                                catch (error) {
                                    // Skip files that can't be read
                                    continue;
                                }
                            }
                        }
                        else if (entry.isDirectory() &&
                            !entry.name.startsWith(".") &&
                            entry.name !== "node_modules") {
                            scanDirectory(fullPath, depth + 1);
                        }
                    }
                }
                catch (error) {
                    // Skip directories that can't be read
                    return;
                }
            };
            scanDirectory(srcPath);
        }
        log(`Minimal indexer completed: ${depsNodes} deps, ${codeNodes} code symbols, ${indexedFiles.length} files`);
    }
    catch (error) {
        log(`Minimal indexer error: ${error.message}`);
    }
    return {
        indexed_files: indexedFiles,
        deps_nodes: depsNodes,
        code_nodes: codeNodes,
    };
}
async function handleDebug(args) {
    const workspacePath = args.workspace_path || process.cwd();
    log(`Debug info for workspace: ${workspacePath}`);
    try {
        const metrics = getMetrics(workspacePath);
        const metricsData = await metrics.collectMetrics();
        return {
            ok: true,
            tool: "gotn_debug",
            message: `Debug info: ${metricsData.nodes} nodes, ${metricsData.edges} edges`,
            workspace_path: workspacePath,
            metrics: metricsData,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        log(`Failed to collect debug info: ${error.message}`);
        throw error;
    }
}
async function handleRecover(args) {
    const workspacePath = args.workspace_path || process.cwd();
    log(`Recovering workspace: ${workspacePath}`);
    try {
        const recoveryEngine = getRecoveryEngine(workspacePath);
        const result = await recoveryEngine.recover();
        // Verify integrity after recovery
        const integrity = await recoveryEngine.verifyIntegrity();
        log(`Recovery completed: ${result.message}`);
        return {
            ok: result.success,
            tool: "gotn_recover",
            message: result.message,
            workspace_path: workspacePath,
            nodes_recovered: result.nodes_recovered,
            edges_recovered: result.edges_recovered,
            skipped_entries: result.skipped_entries,
            corrupt_entries: result.corrupt_entries,
            integrity_check: integrity,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        log(`Failed to recover workspace: ${error.message}`);
        throw error;
    }
}
main().catch((error) => {
    log(`❌ Server error: ${error}`);
    process.exit(1);
});
