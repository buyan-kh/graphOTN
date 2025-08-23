/**
 * OpenAI Embeddings Interface and Implementation
 */
/**
 * Generic embeddings interface
 */
export interface Embeddings {
    embed(text: string): Promise<number[]>;
}
/**
 * OpenAI embeddings implementation with retry logic
 */
export declare class OpenAIEmbedder implements Embeddings {
    private dim;
    private client;
    private model;
    constructor(dim?: number);
    /**
     * Retry helper for handling rate limits and transient errors
     */
    private withRetry;
    /**
     * Generate embedding for the given text
     */
    embed(text: string): Promise<number[]>;
}
/**
 * Factory function to get an embedder instance
 */
export declare function getEmbedder(): Embeddings;
