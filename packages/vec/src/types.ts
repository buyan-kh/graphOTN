/**
 * Vector store type definitions
 */

// Placeholder types for vector operations
export interface EmbeddingRef {
  collection: string;
  id: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}
