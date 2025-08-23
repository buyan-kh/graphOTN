/**
 * Vector Store Interface and Memory Implementation
 */
/**
 * Memory-based vector store implementation with cosine similarity
 */
export class MemoryVectorStore {
    vectors = new Map();
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error(`Vector dimensions don't match: ${vecA.length} vs ${vecB.length}`);
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        const normAB = Math.sqrt(normA) * Math.sqrt(normB);
        if (normAB === 0) {
            return 0; // Handle zero vectors
        }
        return dotProduct / normAB;
    }
    /**
     * Insert or update a vector
     */
    async upsert(id, vec, projectId) {
        if (!Array.isArray(vec) || vec.length === 0) {
            throw new Error("Vector must be a non-empty array");
        }
        if (!vec.every((v) => Number.isFinite(v))) {
            throw new Error("All vector components must be finite numbers");
        }
        // Create a key that includes projectId for isolation
        const key = projectId ? `${projectId}:${id}` : id;
        this.vectors.set(key, {
            id,
            vec: [...vec], // Clone the vector to avoid mutations
            projectId,
        });
    }
    /**
     * Search for similar vectors using cosine similarity
     */
    async search(vec, k, projectId) {
        if (!Array.isArray(vec) || vec.length === 0) {
            throw new Error("Query vector must be a non-empty array");
        }
        if (!vec.every((v) => Number.isFinite(v))) {
            throw new Error("All query vector components must be finite numbers");
        }
        if (k <= 0) {
            throw new Error("k must be positive");
        }
        // Filter vectors by projectId if specified
        const candidateVectors = Array.from(this.vectors.values()).filter((entry) => {
            if (projectId !== undefined) {
                return entry.projectId === projectId;
            }
            return true; // Include all vectors if no projectId filter
        });
        // Calculate similarities and create results
        const results = candidateVectors
            .map((entry) => ({
            id: entry.id,
            score: this.cosineSimilarity(vec, entry.vec),
            projectId: entry.projectId,
        }))
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .slice(0, k); // Take top k results
        return results;
    }
    /**
     * Get the number of stored vectors
     */
    size() {
        return this.vectors.size;
    }
    /**
     * Clear all vectors
     */
    clear() {
        this.vectors.clear();
    }
    /**
     * Get all stored vector IDs (for testing)
     */
    getAllIds() {
        return Array.from(this.vectors.values()).map((entry) => entry.id);
    }
}
/**
 * Factory function to get a vector store instance
 */
/**
 * ZillizVectorStore implementation using Zilliz cloud
 */
export class ZillizVectorStore {
    client; // MilvusClient
    isInitialized = false;
    constructor() {
        // Import and initialize Zilliz client lazily
        // Don't await here - initialization happens on first use
    }
    async initializeClient() {
        if (this.isInitialized)
            return;
        try {
            const { connectZilliz, ensureCollection } = await import("./zilliz.js");
            this.client = connectZilliz();
            await ensureCollection(this.client);
            this.isInitialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize Zilliz client: ${error.message}`);
        }
    }
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initializeClient();
        }
    }
    async upsert(id, vec, projectId = "default") {
        await this.ensureInitialized();
        if (!Array.isArray(vec) || vec.length === 0) {
            throw new Error("Vector must be a non-empty array of numbers.");
        }
        if (!vec.every((v) => typeof v === "number" && Number.isFinite(v))) {
            throw new Error("All vector components must be finite numbers.");
        }
        const { upsertVector } = await import("./zilliz.js");
        await upsertVector(this.client, id, vec, projectId);
    }
    async search(vec, k, projectId = "default") {
        await this.ensureInitialized();
        if (!Array.isArray(vec) || vec.length === 0) {
            throw new Error("Query vector must be a non-empty array of numbers.");
        }
        if (!vec.every((v) => typeof v === "number" && Number.isFinite(v))) {
            throw new Error("All query vector components must be finite numbers.");
        }
        if (k <= 0) {
            throw new Error("k must be positive.");
        }
        const { searchKnn } = await import("./zilliz.js");
        const zillizResults = await searchKnn(this.client, vec, k, projectId);
        // Convert Zilliz results to SearchResult format
        return zillizResults.map((result) => ({
            id: result.id,
            score: result.score,
            vector: [], // Zilliz doesn't return vectors in search results by default
        }));
    }
}
/**
 * Factory function that returns ZillizVectorStore when credentials are available,
 * otherwise falls back to MemoryVectorStore
 */
export function getVectorStore() {
    // Check if Zilliz credentials are available
    if (process.env.ZILLIZ_URI && process.env.ZILLIZ_TOKEN) {
        // Return ZillizVectorStore - errors will be caught during actual operations
        return new ZillizVectorStore();
    }
    // Fall back to memory store
    return new MemoryVectorStore();
}
