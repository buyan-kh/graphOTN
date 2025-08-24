import { readFileSync, writeFileSync, existsSync } from "fs";
export class CloudStore {
    storageFile;
    nodes = new Map();
    edges = new Map();
    constructor() {
        // Use shared file in /tmp for cross-process communication
        this.storageFile = "/tmp/gotn-cloud-store.json";
        this.loadFromFile();
        console.log("🌥️  CloudStore initialized - shared file storage at " + this.storageFile);
    }
    loadFromFile() {
        try {
            if (existsSync(this.storageFile)) {
                const data = JSON.parse(readFileSync(this.storageFile, "utf8"));
                // Load nodes
                for (const [key, node] of Object.entries(data.nodes || {})) {
                    this.nodes.set(key, node);
                }
                // Load edges
                for (const [key, edge] of Object.entries(data.edges || {})) {
                    this.edges.set(key, edge);
                }
                console.log(`📁 Loaded ${this.nodes.size} nodes and ${this.edges.size} edges from shared storage`);
            }
        }
        catch (error) {
            console.log("📁 No existing shared storage found, starting fresh");
        }
    }
    saveToFile() {
        try {
            const data = {
                nodes: Object.fromEntries(this.nodes.entries()),
                edges: Object.fromEntries(this.edges.entries()),
                lastUpdated: new Date().toISOString(),
            };
            writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error("❌ Failed to save to shared storage:", error);
        }
    }
    /**
     * Store a node in the cloud with project isolation
     */
    async storeNode(node, projectId) {
        const cloudNode = {
            ...node,
            project_id: projectId,
        };
        const key = `${projectId}:${node.id}`;
        this.nodes.set(key, cloudNode);
        this.saveToFile(); // Save to shared file
        console.log(`📝 Stored node ${node.id} in project ${projectId}`);
    }
    /**
     * Store an edge in the cloud with project isolation
     */
    async storeEdge(edge, projectId) {
        const cloudEdge = {
            ...edge,
            project_id: projectId,
        };
        const key = `${projectId}:${edge.src}-${edge.dst}-${edge.type || "default"}`;
        this.edges.set(key, cloudEdge);
        this.saveToFile(); // Save to shared file
        console.log(`🔗 Stored edge ${edge.src} -> ${edge.dst} in project ${projectId}`);
    }
    /**
     * Refresh data from shared file (for API server to get latest data)
     */
    refreshFromFile() {
        this.loadFromFile();
    }
    /**
     * Get all nodes for a project
     */
    async getNodes(projectId) {
        this.refreshFromFile(); // Always get latest data
        const projectNodes = [];
        for (const [key, cloudNode] of this.nodes.entries()) {
            if (cloudNode.project_id === projectId) {
                // Remove project_id from the returned node
                const { project_id, ...node } = cloudNode;
                projectNodes.push(node);
            }
        }
        console.log(`📊 Retrieved ${projectNodes.length} nodes for project ${projectId}`);
        return projectNodes;
    }
    /**
     * Get all edges for a project
     */
    async getEdges(projectId) {
        this.refreshFromFile(); // Always get latest data
        const projectEdges = [];
        for (const [key, cloudEdge] of this.edges.entries()) {
            if (cloudEdge.project_id === projectId) {
                // Remove project_id from the returned edge
                const { project_id, ...edge } = cloudEdge;
                projectEdges.push(edge);
            }
        }
        console.log(`🔗 Retrieved ${projectEdges.length} edges for project ${projectId}`);
        return projectEdges;
    }
    /**
     * Get complete graph for a project
     */
    async getGraph(projectId) {
        const [nodes, edges] = await Promise.all([
            this.getNodes(projectId),
            this.getEdges(projectId),
        ]);
        return {
            nodes,
            edges,
            version: 1,
            updated: new Date().toISOString(),
        };
    }
    /**
     * Search nodes by text within a project (simple text matching for now)
     */
    async searchNodes(query, projectId, limit = 10) {
        const allNodes = await this.getNodes(projectId);
        const queryLower = query.toLowerCase();
        const matches = allNodes
            .filter((node) => node.id.toLowerCase().includes(queryLower) ||
            node.summary.toLowerCase().includes(queryLower) ||
            (node.prompt_text &&
                node.prompt_text.toLowerCase().includes(queryLower)))
            .slice(0, limit);
        console.log(`🔍 Found ${matches.length} nodes for query "${query}" in project ${projectId}`);
        return matches;
    }
    /**
     * List all projects (get unique project IDs)
     */
    async listProjects() {
        this.refreshFromFile(); // Always get latest data
        const projectIds = new Set();
        for (const cloudNode of this.nodes.values()) {
            projectIds.add(cloudNode.project_id);
        }
        for (const cloudEdge of this.edges.values()) {
            projectIds.add(cloudEdge.project_id);
        }
        const projects = Array.from(projectIds);
        console.log(`📋 Found ${projects.length} projects`);
        return projects;
    }
    /**
     * Delete all data for a project
     */
    async deleteProject(projectId) {
        let deletedNodes = 0;
        let deletedEdges = 0;
        // Delete nodes
        for (const [key, cloudNode] of this.nodes.entries()) {
            if (cloudNode.project_id === projectId) {
                this.nodes.delete(key);
                deletedNodes++;
            }
        }
        // Delete edges
        for (const [key, cloudEdge] of this.edges.entries()) {
            if (cloudEdge.project_id === projectId) {
                this.edges.delete(key);
                deletedEdges++;
            }
        }
        console.log(`🗑️  Deleted project ${projectId}: ${deletedNodes} nodes, ${deletedEdges} edges`);
    }
    /**
     * Get storage stats
     */
    async getStats() {
        const projects = await this.listProjects();
        return {
            total_nodes: this.nodes.size,
            total_edges: this.edges.size,
            projects: projects.length,
        };
    }
}
// Global instance
let cloudStore = null;
export function getCloudStore() {
    if (!cloudStore) {
        cloudStore = new CloudStore();
    }
    return cloudStore;
}
