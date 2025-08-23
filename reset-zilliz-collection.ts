#!/usr/bin/env node

/**
 * Reset Zilliz collection with correct dimensions
 */

// Load environment variables from .env
import { readFileSync } from "fs";
import { join } from "path";

try {
  const envContent = readFileSync(join(process.cwd(), ".env"), "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (e) {
  console.log("⚠️  Could not load .env file");
}

console.log("🔄 Resetting Zilliz Collection");
console.log("==============================");

async function resetCollection() {
  try {
    const { connectZilliz } = await import("./packages/vec/dist/zilliz.js");
    const { DataType, MetricType } = await import(
      "./packages/vec/node_modules/@zilliz/milvus2-sdk-node/dist/milvus/index.js"
    );

    const client = connectZilliz();
    const collectionName = "gotn_nodes";
    const embeddingDim = 1536; // OpenAI default

    console.log("✅ Connected to Zilliz");

    // Check if collection exists
    const hasCollection = await client.hasCollection({
      collection_name: collectionName,
    });

    if (hasCollection.value) {
      console.log("🗑️  Dropping existing collection...");
      await client.dropCollection({
        collection_name: collectionName,
      });
      console.log("✅ Collection dropped");
    }

    // Create new collection with correct dimensions
    console.log(`🏗️  Creating collection with ${embeddingDim} dimensions...`);

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

    console.log("✅ Collection created");

    // Create index
    console.log("📊 Creating cosine similarity index...");
    await client.createIndex({
      collection_name: collectionName,
      field_name: "embedding",
      index_type: "IVF_FLAT",
      metric_type: MetricType.COSINE,
      params: { nlist: 1024 },
    });

    console.log("✅ Index created");

    // Load collection
    console.log("📥 Loading collection into memory...");
    await client.loadCollection({
      collection_name: collectionName,
    });

    console.log("✅ Collection loaded");

    // Verify collection
    const collectionInfo = await client.describeCollection({
      collection_name: collectionName,
    });

    console.log("\n📋 Collection Schema:");
    collectionInfo.schema.fields.forEach((field: any) => {
      console.log(
        `   - ${field.name}: ${field.data_type}${
          field.dim ? ` (dim: ${field.dim})` : ""
        } ${field.is_primary_key ? "(PRIMARY)" : ""}`
      );
    });

    console.log("\n🎉 Collection reset successfully!");
    console.log("Ready for 1536-dimensional OpenAI embeddings");

    return true;
  } catch (error: any) {
    console.error("❌ Reset failed:", error.message);
    return false;
  }
}

resetCollection()
  .then((success) => {
    console.log(
      success ? "\n✅ Collection reset complete" : "\n❌ Reset failed"
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Reset runner failed:", error);
    process.exit(1);
  });
