/**
 * GoTN Filesystem Storage Layer
 *
 * Manages .gotn state with atomic writes, locking, and durable persistence.
 * All operations are designed to be safe for concurrent access.
 */
import { type Graph, type Meta, type JournalEntry, type Node, type Edge } from "./schemas.js";
export type GoTNMeta = Meta;
export type GoTNGraph = Graph;
export type GoTNNode = Node;
export type GoTNEdge = Edge;
export { type JournalEntry } from "./schemas.js";
/**
 * Serializes write operations to prevent concurrent modifications
 */
export declare function withWriteLock<T>(lockKey: string, operation: () => Promise<T>): Promise<T>;
/**
 * Initialize .gotn storage structure
 */
export declare function initStore(workspacePath: string): Promise<void>;
/**
 * Read meta.json with validation
 */
export declare function readMeta(workspacePath: string): Promise<GoTNMeta>;
/**
 * Read graph.json with validation
 */
export declare function readGraph(workspacePath: string): Promise<GoTNGraph>;
/**
 * Write graph.json atomically with validation
 */
export declare function writeGraph(workspacePath: string, graph: GoTNGraph): Promise<void>;
/**
 * Append entry to journal.ndjson with validation
 */
export declare function appendJournal(workspacePath: string, entry: Omit<JournalEntry, "timestamp" | "id">): Promise<void>;
/**
 * Read all journal entries
 */
export declare function readJournal(workspacePath: string): Promise<JournalEntry[]>;
/**
 * Check if .gotn exists and is properly initialized
 */
export declare function isInitialized(workspacePath: string): Promise<boolean>;
/**
 * Recover graph from journal events
 * Rebuilds graph.json from the append-only journal
 */
export declare function recoverFromJournal(workspacePath: string): Promise<void>;
/**
 * Add a node to the graph with journal logging
 */
export declare function addNode(workspacePath: string, node: Node): Promise<void>;
/**
 * Update an existing node in the graph with journal logging
 */
export declare function updateNode(workspacePath: string, nodeId: string, node: Node): Promise<void>;
/**
 * Add an edge to the graph with journal logging
 */
export declare function addEdge(workspacePath: string, edge: Edge): Promise<void>;
/**
 * Update an existing edge in the graph with journal logging
 */
export declare function updateEdge(workspacePath: string, src: string, dst: string, edge: Edge): Promise<void>;
