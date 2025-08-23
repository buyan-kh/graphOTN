/**
 * Vector Store Interface and Memory Implementation
 */
/**
 * Generic vector store interface
 */
export interface VectorStore {
    /**
     * Insert or update a vector with associated metadata
     */
    upsert(id: string, vec: number[], projectId?: string): Promise<void>;
    /**
     * Search for similar vectors
     */
    search(vec: number[], k: number, projectId?: string): Promise<Array<{
        id: string;
        score: number;
        projectId?: string;
    }>>;
}
/**
 * Search result interface
 */
export interface SearchResult {
    id: string;
    score: number;
    projectId?: string;
}
/**
 * Memory-based vector store implementation with cosine similarity
 */
export declare class MemoryVectorStore implements VectorStore {
    private vectors;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Insert or update a vector
     */
    upsert(id: string, vec: number[], projectId?: string): Promise<void>;
    /**
     * Search for similar vectors using cosine similarity
     */
    search(vec: number[], k: number, projectId?: string): Promise<SearchResult[]>;
    /**
     * Get the number of stored vectors
     */
    size(): number;
    /**
     * Clear all vectors
     */
    clear(): void;
    /**
     * Get all stored vector IDs (for testing)
     */
    getAllIds(): string[];
}
/**
 * Factory function to get a vector store instance
 */
/**
 * ZillizVectorStore implementation using Zilliz cloud
 */
export declare class ZillizVectorStore implements VectorStore {
    private client;
    private isInitialized;
    constructor();
    private initializeClient;
    private ensureInitialized;
    upsert(id: string, vec: number[], projectId?: string): Promise<void>;
    search(vec: number[], k: number, projectId?: string): Promise<SearchResult[]>;
}
/**
 * Factory function that returns ZillizVectorStore when credentials are available,
 * otherwise falls back to MemoryVectorStore
 */
export declare function getVectorStore(): VectorStore;
