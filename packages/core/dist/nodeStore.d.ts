/**
 * NodeStore - High-level API that combines fsStore and vector operations
 */
import { Node } from "./schemas.js";
export interface NodeSearchResult {
    id: string;
    summary: string;
    score: number;
}
export declare class NodeStore {
    private vectorStore;
    private embedder;
    private projectId;
    private initialized;
    constructor(projectId?: string);
    private ensureInitialized;
    /**
     * Store a node: validate → write → journal → embed → upsert → update embedding_ref
     */
    storeNode(node: Node): Promise<void>;
    /**
     * Get a node by its ID
     */
    getNode(id: string): Promise<Node | null>;
    /**
     * Search nodes by text using semantic similarity
     */
    searchNodesByText(query: string, limit?: number): Promise<NodeSearchResult[]>;
    /**
     * Get all nodes (for debugging/testing)
     */
    getAllNodes(): Promise<Node[]>;
    /**
     * Get node count
     */
    getNodeCount(): Promise<number>;
}
export declare function getNodeStore(projectId?: string): NodeStore;
