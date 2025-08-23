/**
 * GoTN Filesystem Storage Layer
 *
 * Manages .gotn state with atomic writes, locking, and durable persistence.
 * All operations are designed to be safe for concurrent access.
 */
export interface GoTNMeta {
    version: string;
    created: string;
    updated: string;
    workspace_path: string;
}
export interface GoTNGraph {
    nodes: GoTNNode[];
    edges: GoTNEdge[];
    version: number;
    updated: string;
}
export interface GoTNNode {
    id: string;
    kind: string;
    summary: string;
    prompt_text: string;
    parent?: string;
    children: string[];
    requires: string[];
    produces: string[];
    exec_target?: string;
    embedding_ref?: {
        collection: string;
        id: string;
    };
    tags: string[];
    success_criteria: string[];
    guards: string[];
    artifacts: {
        files: string[];
    };
    status: "ready" | "running" | "completed" | "failed" | "skipped";
    provenance: {
        created_by: string;
        source: string;
    };
    version: number;
}
export interface GoTNEdge {
    from: string;
    to: string;
    type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
    weight?: number;
    evidence?: string;
}
export interface JournalEntry {
    timestamp: string;
    event: string;
    data: any;
    id: string;
}
/**
 * Serializes write operations to prevent concurrent modifications
 */
export declare function withWriteLock<T>(lockKey: string, operation: () => Promise<T>): Promise<T>;
/**
 * Initialize .gotn storage structure
 */
export declare function initStore(workspacePath: string): Promise<void>;
/**
 * Read meta.json
 */
export declare function readMeta(workspacePath: string): Promise<GoTNMeta>;
/**
 * Read graph.json
 */
export declare function readGraph(workspacePath: string): Promise<GoTNGraph>;
/**
 * Write graph.json atomically
 */
export declare function writeGraph(workspacePath: string, graph: GoTNGraph): Promise<void>;
/**
 * Append entry to journal.ndjson
 */
export declare function appendJournal(workspacePath: string, entry: Omit<JournalEntry, 'timestamp' | 'id'>): Promise<void>;
/**
 * Read all journal entries
 */
export declare function readJournal(workspacePath: string): Promise<JournalEntry[]>;
/**
 * Check if .gotn exists and is properly initialized
 */
export declare function isInitialized(workspacePath: string): Promise<boolean>;
