import { Node, Edge, Graph } from "./schemas.js";
/**
 * Cloud-first storage for GoTN
 * Everything stored in shared file for cross-process communication
 * No local filesystem dependencies (except for shared storage file)
 */
export interface CloudNode extends Node {
    project_id: string;
}
export interface CloudEdge extends Edge {
    project_id: string;
}
export declare class CloudStore {
    private storageFile;
    private nodes;
    private edges;
    constructor();
    private loadFromFile;
    private saveToFile;
    /**
     * Store a node in the cloud with project isolation
     */
    storeNode(node: Node, projectId: string): Promise<void>;
    /**
     * Store an edge in the cloud with project isolation
     */
    storeEdge(edge: Edge, projectId: string): Promise<void>;
    /**
     * Refresh data from shared file (for API server to get latest data)
     */
    private refreshFromFile;
    /**
     * Get all nodes for a project
     */
    getNodes(projectId: string): Promise<Node[]>;
    /**
     * Get all edges for a project
     */
    getEdges(projectId: string): Promise<Edge[]>;
    /**
     * Get complete graph for a project
     */
    getGraph(projectId: string): Promise<Graph>;
    /**
     * Search nodes by text within a project (simple text matching for now)
     */
    searchNodes(query: string, projectId: string, limit?: number): Promise<Node[]>;
    /**
     * List all projects (get unique project IDs)
     */
    listProjects(): Promise<string[]>;
    /**
     * Delete all data for a project
     */
    deleteProject(projectId: string): Promise<void>;
    /**
     * Get storage stats
     */
    getStats(): Promise<{
        total_nodes: number;
        total_edges: number;
        projects: number;
    }>;
}
export declare function getCloudStore(): CloudStore;
