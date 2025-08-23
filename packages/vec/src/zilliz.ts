/**
 * Zilliz Milvus Client Implementation
 */

import { MilvusClient, DataType, MetricType } from "@zilliz/milvus2-sdk-node";

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
export function connectZilliz(): MilvusClient {
  const uri = process.env.ZILLIZ_URI;
  const token = process.env.ZILLIZ_TOKEN;

  if (!uri) {
    throw new Error("ZILLIZ_URI environment variable is required");
  }

  if (!token) {
    throw new Error("ZILLIZ_TOKEN environment variable is required");
  }

  console.log(`Connecting to Zilliz at: ${uri.replace(/\/\/.*@/, "//***@")}`);

  const client = new MilvusClient({
    address: uri,
    token: token,
    ssl: true,
  });

  return client;
}

/**
 * Ensure the gotn_nodes collection exists with proper schema and index
 */
export async function ensureCollection(client: MilvusClient): Promise<void> {
  const collectionName = "gotn_nodes";
  const embeddingDim = Number(process.env.GOTN_EMBED_DIM) || 1536;

  console.log(
    `Ensuring collection: ${collectionName} with dimension: ${embeddingDim}`
  );

  // Check if collection exists
  const hasCollection = await client.hasCollection({
    collection_name: collectionName,
  });

  if (!hasCollection.value) {
    console.log(`Creating collection: ${collectionName}`);

    // Create collection with schema
    await client.createCollection({
      collection_name: collectionName,
      fields: [
        {
          name: "id",
          description: "Primary key for the vector",
          data_type: DataType.VarChar,
          max_length: 256,
          is_primary_key: true,
        },
        {
          name: "project_id",
          description: "Project identifier for multi-tenancy",
          data_type: DataType.VarChar,
          max_length: 256,
        },
        {
          name: "embedding",
          description: "Vector embedding",
          data_type: DataType.FloatVector,
          dim: embeddingDim,
        },
      ],
    });

    console.log(`Collection ${collectionName} created successfully`);

    // Create index for vector field
    await client.createIndex({
      collection_name: collectionName,
      field_name: "embedding",
      index_type: "IVF_FLAT",
      metric_type: MetricType.COSINE,
      params: { nlist: 1024 },
    });

    console.log(
      `Index created for ${collectionName}.embedding with cosine metric`
    );
  } else {
    console.log(`Collection ${collectionName} already exists`);
  }

  // Load collection into memory
  await client.loadCollection({
    collection_name: collectionName,
  });

  console.log(`Collection ${collectionName} loaded into memory`);
}

/**
 * Upsert a vector into the collection
 */
export async function upsertVector(
  client: MilvusClient,
  id: string,
  embedding: number[],
  projectId?: string
): Promise<void> {
  const collectionName = "gotn_nodes";

  console.log(`Upserting vector: ${id} (project: ${projectId || "default"})`);

  await client.upsert({
    collection_name: collectionName,
    data: [
      {
        id: id,
        project_id: projectId || "",
        embedding: embedding,
      },
    ],
  });

  console.log(`Vector ${id} upserted successfully`);
}

/**
 * Search for similar vectors using KNN
 */
export async function searchKnn(
  client: MilvusClient,
  queryVector: number[],
  topK: number,
  projectId?: string
): Promise<ZillizSearchResult[]> {
  const collectionName = "gotn_nodes";

  console.log(
    `Searching for ${topK} similar vectors (project: ${projectId || "all"})`
  );

  // Build filter expression for project isolation
  let filter = "";
  if (projectId !== undefined) {
    filter = `project_id == "${projectId}"`;
  }

  const searchParams = {
    collection_name: collectionName,
    vectors: [queryVector],
    search_params: {
      anns_field: "embedding",
      topk: topK,
      metric_type: MetricType.COSINE,
      params: { nprobe: 10 },
    },
    output_fields: ["id", "project_id"],
    ...(filter && { filter }),
  };

  const searchResult = await client.search(searchParams);

  if (!searchResult.results || searchResult.results.length === 0) {
    return [];
  }

  const results: ZillizSearchResult[] = searchResult.results.map(
    (result: any) => ({
      id: result.id,
      score: result.score,
      project_id: result.project_id || undefined,
    })
  );

  console.log(`Found ${results.length} similar vectors`);

  return results;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(client: MilvusClient): Promise<{
  count: number;
  indexedCount: number;
}> {
  const collectionName = "gotn_nodes";

  const stats = await client.getCollectionStatistics({
    collection_name: collectionName,
  });

  // Parse stats array to find row_count and indexed_row_count
  let count = 0;
  let indexedCount = 0;

  if (stats.stats && Array.isArray(stats.stats)) {
    const rowCountStat = stats.stats.find((stat) => stat.key === "row_count");
    const indexedRowCountStat = stats.stats.find(
      (stat) => stat.key === "indexed_row_count"
    );

    count = parseInt(String(rowCountStat?.value || "0"));
    indexedCount = parseInt(String(indexedRowCountStat?.value || "0"));
  }

  return {
    count,
    indexedCount,
  };
}

/**
 * Check if Zilliz connection is working
 */
export async function checkConnection(client: MilvusClient): Promise<boolean> {
  try {
    await client.checkHealth();
    return true;
  } catch (error) {
    console.error("Zilliz connection check failed:", error);
    return false;
  }
}
