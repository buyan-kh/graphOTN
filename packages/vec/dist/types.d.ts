/**
 * Vector store type definitions
 */
export interface EmbeddingRef {
    collection: string;
    id: string;
}
export interface VectorSearchResult {
    id: string;
    score: number;
    metadata?: Record<string, unknown>;
}
