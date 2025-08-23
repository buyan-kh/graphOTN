/**
 * NodeStore - High-level API that combines fsStore and vector operations
 */
import { NodeSchema } from "./schemas.js";
import { readGraph, addNode as fsAddNode, updateNode as fsUpdateNode, } from "./fsStore.js";
export class NodeStore {
    vectorStore = null;
    embedder = null;
    projectId;
    initialized = false;
    constructor(projectId = "default") {
        this.projectId = projectId;
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        try {
            // Try to dynamically require vec package at runtime
            const vecModule = require("@gotn/vec");
            this.vectorStore = vecModule.getVectorStore();
            this.embedder = vecModule.getEmbedder();
        }
        catch (error) {
            console.warn("Vector components not available, using fallback implementations");
            // Fallback to no-op implementations
            this.vectorStore = {
                async upsert() { },
                async search() {
                    return [];
                },
            };
            this.embedder = {
                async embed() {
                    return [];
                },
            };
        }
        this.initialized = true;
    }
    /**
     * Store a node: validate → write → journal → embed → upsert → update embedding_ref
     */
    async storeNode(node) {
        await this.ensureInitialized();
        // 1. Validate the node
        const validatedNode = NodeSchema.parse(node);
        // 2. Write node to graph and append to journal
        await fsAddNode(".", validatedNode);
        // 3. Create embedding text from summary and prompt_text
        const embeddingText = [
            validatedNode.summary,
            validatedNode.prompt_text,
            ...validatedNode.tags,
        ]
            .filter(Boolean)
            .join(" ");
        if (embeddingText.trim() && this.embedder && this.vectorStore) {
            try {
                // 4. Generate embedding
                const embedding = await this.embedder.embed(embeddingText);
                // 5. Upsert vector to vector store
                await this.vectorStore.upsert(validatedNode.id, embedding, this.projectId);
                // 6. Update node with embedding reference
                const updatedNode = {
                    ...validatedNode,
                    embedding_ref: {
                        collection: "gotn_nodes",
                        id: validatedNode.id,
                    },
                };
                // Write updated node back to storage
                await fsUpdateNode(".", updatedNode.id, updatedNode);
            }
            catch (error) {
                console.warn(`Failed to create embedding for node ${validatedNode.id}:`, error.message);
                // Node is still stored, just without embedding
            }
        }
    }
    /**
     * Get a node by its ID
     */
    async getNode(id) {
        const graph = await readGraph(".");
        const node = graph.nodes.find((n) => n.id === id);
        return node || null;
    }
    /**
     * Search nodes by text using semantic similarity
     */
    async searchNodesByText(query, limit = 10) {
        await this.ensureInitialized();
        if (!query.trim() || !this.embedder || !this.vectorStore) {
            return [];
        }
        try {
            // 1. Generate embedding for query
            const queryEmbedding = await this.embedder.embed(query);
            // 2. Search vector store
            const vectorResults = await this.vectorStore.search(queryEmbedding, limit, this.projectId);
            // 3. Get node summaries for results
            const graph = await readGraph(".");
            const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
            const results = vectorResults
                .map((result) => {
                const node = nodeMap.get(result.id);
                if (!node)
                    return null;
                return {
                    id: result.id,
                    summary: node.summary,
                    score: result.score,
                };
            })
                .filter((result) => result !== null);
            return results;
        }
        catch (error) {
            console.warn("Failed to search nodes by text:", error.message);
            return [];
        }
    }
    /**
     * Get all nodes (for debugging/testing)
     */
    async getAllNodes() {
        const graph = await readGraph(".");
        return graph.nodes;
    }
    /**
     * Get node count
     */
    async getNodeCount() {
        const graph = await readGraph(".");
        return graph.nodes.length;
    }
}
/**
 * Default NodeStore instance
 */
let defaultNodeStore = null;
export function getNodeStore(projectId) {
    if (!defaultNodeStore || (projectId && projectId !== "default")) {
        defaultNodeStore = new NodeStore(projectId);
    }
    return defaultNodeStore;
}
