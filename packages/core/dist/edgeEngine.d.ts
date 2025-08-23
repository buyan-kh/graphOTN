/**
 * EdgeEngine - Automatic edge inference for GoTN graphs
 *
 * Creates two types of edges:
 * 1. Hard edges: structural dependencies from requires/produces tags
 * 2. Soft edges: semantic similarity from embedding vectors
 */
import { Node, Edge } from "./schemas.js";
export interface EdgeInferenceResult {
    hardEdges: Edge[];
    softEdges: Edge[];
    totalEdgesCreated: number;
}
export interface SoftEdgeCandidate {
    nodeA: Node;
    nodeB: Node;
    score: number;
    evidence: string;
}
export declare class EdgeEngine {
    private vectorStore;
    private initialized;
    constructor();
    private ensureInitialized;
    /**
     * Infer hard edges based on requires/produces tag matching
     */
    inferHardEdges(nodes: Node[]): Promise<Edge[]>;
    /**
     * Infer soft edges based on semantic similarity
     */
    inferSoftEdges(nodes: Node[], k?: number, threshold?: number): Promise<Edge[]>;
    /**
     * Infer all edges for the given node IDs
     */
    inferEdges(nodeIds?: string[]): Promise<EdgeInferenceResult>;
}
export declare function getEdgeEngine(): EdgeEngine;
