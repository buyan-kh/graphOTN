/**
 * GoTN Filesystem Storage Layer
 *
 * Manages .gotn state with atomic writes, locking, and durable persistence.
 * All operations are designed to be safe for concurrent access.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createWriteStream } from "fs";
import { promisify } from "util";
import {
  validateGraph,
  validateMeta,
  validateJournalEntry,
  validateNode,
  validateEdge,
  formatValidationError,
  type Graph,
  type Meta,
  type JournalEntry,
  type Node,
  type Edge,
  type JournalEventType,
} from "./schemas.js";

// Re-export types from schemas for compatibility
export type GoTNMeta = Meta;
export type GoTNGraph = Graph;
export type GoTNNode = Node;
export type GoTNEdge = Edge;
export { type JournalEntry } from "./schemas.js";

// Lock management
const writeLocks = new Map<string, Promise<void>>();

/**
 * Ensures atomic write operations using temp file + rename + fsync pattern
 */
async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // Write to temp file
    await fs.writeFile(tempPath, data, { encoding: "utf8" });

    // Atomic rename
    await fs.rename(tempPath, filePath);

    // Ensure data is flushed to disk
    const fd = await fs.open(filePath, "r+");
    await fd.sync();
    await fd.close();
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Serializes write operations to prevent concurrent modifications
 */
export async function withWriteLock<T>(
  lockKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Wait for any existing lock
  const existingLock = writeLocks.get(lockKey);
  if (existingLock) {
    await existingLock;
  }

  // Create new lock
  const lockPromise = (async () => {
    try {
      return await operation();
    } finally {
      writeLocks.delete(lockKey);
    }
  })();

  writeLocks.set(
    lockKey,
    lockPromise.then(() => undefined)
  );

  return lockPromise;
}

/**
 * Initialize .gotn storage structure
 */
export async function initStore(workspacePath: string): Promise<void> {
  const gotnPath = path.join(workspacePath, ".gotn");

  await withWriteLock(`init:${gotnPath}`, async () => {
    // Create directory structure
    await fs.mkdir(gotnPath, { recursive: true });
    await fs.mkdir(path.join(gotnPath, "locks"), { recursive: true });
    await fs.mkdir(path.join(gotnPath, "runs"), { recursive: true });
    await fs.mkdir(path.join(gotnPath, "cache"), { recursive: true });

    const now = new Date().toISOString();

    // Initialize meta.json
    const metaPath = path.join(gotnPath, "meta.json");
    try {
      await fs.access(metaPath);
      // File exists, just update timestamp
      const existingMeta = await readMeta(workspacePath);
      existingMeta.updated = now;
      await atomicWrite(metaPath, JSON.stringify(existingMeta, null, 2));
    } catch {
      // File doesn't exist, create it
      const meta: GoTNMeta = {
        version: "0.1.0",
        created: now,
        updated: now,
        workspace_path: workspacePath,
      };
      await atomicWrite(metaPath, JSON.stringify(meta, null, 2));
    }

    // Initialize graph.json
    const graphPath = path.join(gotnPath, "graph.json");
    try {
      await fs.access(graphPath);
      // File exists, don't overwrite
    } catch {
      // File doesn't exist, create empty graph
      const graph: GoTNGraph = {
        nodes: [],
        edges: [],
        version: 1,
        updated: now,
      };
      await atomicWrite(graphPath, JSON.stringify(graph, null, 2));
    }

    // Initialize journal.ndjson if it doesn't exist
    const journalPath = path.join(gotnPath, "journal.ndjson");
    try {
      await fs.access(journalPath);
      // File exists, don't overwrite
    } catch {
      // Create empty journal file
      await atomicWrite(journalPath, "");
    }
  });
}

/**
 * Read meta.json with validation
 */
export async function readMeta(workspacePath: string): Promise<GoTNMeta> {
  const metaPath = path.join(workspacePath, ".gotn", "meta.json");
  const content = await fs.readFile(metaPath, "utf8");

  try {
    const data = JSON.parse(content);
    return validateMeta(data);
  } catch (error: any) {
    if (error.name === "ZodError") {
      throw new Error(
        `Invalid meta.json format: ${formatValidationError(error)}`
      );
    }
    throw error;
  }
}

/**
 * Read graph.json with validation
 */
export async function readGraph(workspacePath: string): Promise<GoTNGraph> {
  const graphPath = path.join(workspacePath, ".gotn", "graph.json");
  const content = await fs.readFile(graphPath, "utf8");

  try {
    const data = JSON.parse(content);
    return validateGraph(data);
  } catch (error: any) {
    if (error.name === "ZodError") {
      throw new Error(
        `Invalid graph.json format: ${formatValidationError(error)}`
      );
    }
    throw error;
  }
}

/**
 * Write graph.json atomically with validation
 */
export async function writeGraph(
  workspacePath: string,
  graph: GoTNGraph
): Promise<void> {
  const graphPath = path.join(workspacePath, ".gotn", "graph.json");

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Update version and timestamp
    graph.version += 1;
    graph.updated = new Date().toISOString();

    // Validate before writing
    try {
      validateGraph(graph);
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new Error(`Invalid graph data: ${formatValidationError(error)}`);
      }
      throw error;
    }

    // Write atomically
    await atomicWrite(graphPath, JSON.stringify(graph, null, 2));
  });
}

/**
 * Append entry to journal.ndjson with validation
 */
export async function appendJournal(
  workspacePath: string,
  entry: Omit<JournalEntry, "timestamp" | "id">
): Promise<void> {
  const journalPath = path.join(workspacePath, ".gotn", "journal.ndjson");

  await withWriteLock(`journal:${workspacePath}`, async () => {
    const fullEntry: JournalEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Validate before writing
    try {
      validateJournalEntry(fullEntry);
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new Error(
          `Invalid journal entry: ${formatValidationError(error)}`
        );
      }
      throw error;
    }

    const line = JSON.stringify(fullEntry) + "\n";
    await fs.appendFile(journalPath, line, "utf8");
  });
}

/**
 * Read all journal entries
 */
export async function readJournal(
  workspacePath: string
): Promise<JournalEntry[]> {
  const journalPath = path.join(workspacePath, ".gotn", "journal.ndjson");

  try {
    const content = await fs.readFile(journalPath, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Check if .gotn exists and is properly initialized
 */
export async function isInitialized(workspacePath: string): Promise<boolean> {
  try {
    const gotnPath = path.join(workspacePath, ".gotn");
    await fs.access(gotnPath);

    // Check required files
    await fs.access(path.join(gotnPath, "meta.json"));
    await fs.access(path.join(gotnPath, "graph.json"));
    await fs.access(path.join(gotnPath, "journal.ndjson"));

    return true;
  } catch {
    return false;
  }
}

/**
 * Recover graph from journal events
 * Rebuilds graph.json from the append-only journal
 */
export async function recoverFromJournal(workspacePath: string): Promise<void> {
  const journalPath = path.join(workspacePath, ".gotn", "journal.ndjson");
  const graphPath = path.join(workspacePath, ".gotn", "graph.json");

  console.error(
    `[GoTN Recovery] Starting recovery from journal: ${journalPath}`
  );

  try {
    // Read all journal entries
    const journalEntries = await readJournal(workspacePath);
    console.error(
      `[GoTN Recovery] Found ${journalEntries.length} journal entries`
    );

    // Initialize empty graph
    const recoveredGraph: Graph = {
      nodes: [],
      edges: [],
      version: 1,
      updated: new Date().toISOString(),
    };

    const nodeMap = new Map<string, Node>();
    const edgeMap = new Map<string, Edge>();

    // Process journal entries in chronological order
    for (const entry of journalEntries) {
      try {
        switch (entry.event) {
          case "add_node": {
            const nodeData = entry.data as any;
            if (nodeData.node) {
              const node = nodeData.node as Node;
              nodeMap.set(node.id, node);
              console.error(`[GoTN Recovery] Added node: ${node.id}`);
            }
            break;
          }

          case "update_node": {
            const nodeData = entry.data as any;
            if (nodeData.node_id && nodeData.node) {
              const node = nodeData.node as Node;
              nodeMap.set(node.id, node);
              console.error(`[GoTN Recovery] Updated node: ${node.id}`);
            }
            break;
          }

          case "add_edge": {
            const edgeData = entry.data as any;
            if (edgeData.edge) {
              const edge = edgeData.edge as Edge;
              const edgeKey = `${edge.src}->${edge.dst}`;
              edgeMap.set(edgeKey, edge);
              console.error(`[GoTN Recovery] Added edge: ${edgeKey}`);
            }
            break;
          }

          case "update_edge": {
            const edgeData = entry.data as any;
            if (edgeData.edge) {
              const edge = edgeData.edge as Edge;
              const edgeKey = `${edge.src}->${edge.dst}`;
              edgeMap.set(edgeKey, edge);
              console.error(`[GoTN Recovery] Updated edge: ${edgeKey}`);
            }
            break;
          }

          case "workspace_initialized":
          case "start_run":
          case "finish_run":
            // These events don't affect the graph structure
            break;

          default:
            console.error(`[GoTN Recovery] Unknown event type: ${entry.event}`);
        }
      } catch (error: any) {
        console.error(
          `[GoTN Recovery] Error processing entry ${entry.id}: ${error.message}`
        );
        // Continue processing other entries
      }
    }

    // Convert maps to arrays
    recoveredGraph.nodes = Array.from(nodeMap.values());
    recoveredGraph.edges = Array.from(edgeMap.values());

    // Update version based on journal length
    recoveredGraph.version = Math.max(1, journalEntries.length);

    console.error(
      `[GoTN Recovery] Recovered graph with ${recoveredGraph.nodes.length} nodes and ${recoveredGraph.edges.length} edges`
    );

    // Validate recovered graph
    validateGraph(recoveredGraph);

    // Write recovered graph atomically
    await atomicWrite(graphPath, JSON.stringify(recoveredGraph, null, 2));

    console.error(
      `[GoTN Recovery] Successfully recovered graph to: ${graphPath}`
    );
  } catch (error: any) {
    console.error(`[GoTN Recovery] Recovery failed: ${error.message}`);

    // If recovery fails, create a minimal valid graph
    const minimalGraph: Graph = {
      nodes: [],
      edges: [],
      version: 1,
      updated: new Date().toISOString(),
    };

    await atomicWrite(graphPath, JSON.stringify(minimalGraph, null, 2));
    console.error(`[GoTN Recovery] Created minimal graph as fallback`);
  }
}

/**
 * Add a node to the graph with journal logging
 */
export async function addNode(
  workspacePath: string,
  node: Node
): Promise<void> {
  // Validate node before adding
  const validatedNode = validateNode(node);

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Read current graph
    const graph = await readGraph(workspacePath);

    // Check if node already exists
    const existingNodeIndex = graph.nodes.findIndex(
      (n) => n.id === validatedNode.id
    );
    if (existingNodeIndex >= 0) {
      throw new Error(`Node with ID ${validatedNode.id} already exists`);
    }

    // Add node to graph
    graph.nodes.push(validatedNode);

    // Write updated graph
    await writeGraph(workspacePath, graph);

    // Log to journal
    await appendJournal(workspacePath, {
      event: "add_node",
      data: { node: validatedNode },
    });
  });
}

/**
 * Update an existing node in the graph with journal logging
 */
export async function updateNode(
  workspacePath: string,
  nodeId: string,
  node: Node
): Promise<void> {
  // Validate node before updating
  const validatedNode = validateNode(node);

  if (validatedNode.id !== nodeId) {
    throw new Error("Node ID cannot be changed during update");
  }

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Read current graph
    const graph = await readGraph(workspacePath);

    // Find existing node
    const existingNodeIndex = graph.nodes.findIndex((n) => n.id === nodeId);
    if (existingNodeIndex === -1) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Update node in graph
    graph.nodes[existingNodeIndex] = validatedNode;

    // Write updated graph
    await writeGraph(workspacePath, graph);

    // Log to journal
    await appendJournal(workspacePath, {
      event: "update_node",
      data: { node_id: nodeId, node: validatedNode },
    });
  });
}

/**
 * Add an edge to the graph with journal logging
 */
export async function addEdge(
  workspacePath: string,
  edge: Edge
): Promise<void> {
  // Validate edge before adding
  const validatedEdge = validateEdge(edge);

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Read current graph
    const graph = await readGraph(workspacePath);

    // Check if edge already exists
    const existingEdgeIndex = graph.edges.findIndex(
      (e) =>
        e.src === validatedEdge.src &&
        e.dst === validatedEdge.dst &&
        e.type === validatedEdge.type
    );
    if (existingEdgeIndex >= 0) {
      throw new Error(
        `Edge from ${validatedEdge.src} to ${validatedEdge.dst} of type ${validatedEdge.type} already exists`
      );
    }

    // Add edge to graph
    graph.edges.push(validatedEdge);

    // Write updated graph
    await writeGraph(workspacePath, graph);

    // Log to journal
    await appendJournal(workspacePath, {
      event: "add_edge",
      data: { edge: validatedEdge },
    });
  });
}

/**
 * Update an existing edge in the graph with journal logging
 */
export async function updateEdge(
  workspacePath: string,
  src: string,
  dst: string,
  edge: Edge
): Promise<void> {
  // Validate edge before updating
  const validatedEdge = validateEdge(edge);

  if (validatedEdge.src !== src || validatedEdge.dst !== dst) {
    throw new Error(
      "Edge source and destination cannot be changed during update"
    );
  }

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Read current graph
    const graph = await readGraph(workspacePath);

    // Find existing edge
    const existingEdgeIndex = graph.edges.findIndex(
      (e) => e.src === src && e.dst === dst
    );
    if (existingEdgeIndex === -1) {
      throw new Error(`Edge from ${src} to ${dst} not found`);
    }

    // Update edge in graph
    graph.edges[existingEdgeIndex] = validatedEdge;

    // Write updated graph
    await writeGraph(workspacePath, graph);

    // Log to journal
    await appendJournal(workspacePath, {
      event: "update_edge",
      data: { edge_src: src, edge_dst: dst, edge: validatedEdge },
    });
  });
}
