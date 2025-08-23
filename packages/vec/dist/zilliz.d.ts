/**
 * Zilliz Milvus Client Implementation
 */
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
/**
 * Zilliz search result interface
 */
export interface ZillizSearchResult {
    id: string;
    score: number;
    project_id?: string;
}
/**
 * Connect to Zilliz using environment variables
 */
export declare function connectZilliz(): MilvusClient;
/**
 * Ensure the gotn_nodes collection exists with proper schema and index
 */
export declare function ensureCollection(client: MilvusClient): Promise<void>;
/**
 * Upsert a vector into the collection
 */
export declare function upsertVector(client: MilvusClient, id: string, embedding: number[], projectId?: string): Promise<void>;
/**
 * Search for similar vectors using KNN
 */
export declare function searchKnn(client: MilvusClient, queryVector: number[], topK: number, projectId?: string): Promise<ZillizSearchResult[]>;
/**
 * Get collection statistics
 */
export declare function getCollectionStats(client: MilvusClient): Promise<{
    count: number;
    indexedCount: number;
}>;
/**
 * Check if Zilliz connection is working
 */
export declare function checkConnection(client: MilvusClient): Promise<boolean>;
