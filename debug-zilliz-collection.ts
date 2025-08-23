#!/usr/bin/env node

/**
 * Debug Zilliz collection and vector operations
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

console.log("🐛 Debugging Zilliz Collection");
console.log("==============================");

async function debugCollection() {
  try {
    // Import Milvus client directly for debugging
    const { MilvusClient, DataType, MetricType } = await import(
      "@zilliz/milvus2-sdk-node"
    );

    const client = new MilvusClient({
      address: process.env.ZILLIZ_URI!,
      token: process.env.ZILLIZ_TOKEN!,
      ssl: true,
    });

    console.log("✅ Connected to Zilliz");

    const collectionName = "gotn_nodes";

    // Check if collection exists
    const hasCollection = await client.hasCollection({
      collection_name: collectionName,
    });
    console.log(`Collection exists: ${hasCollection.value}`);

    if (hasCollection.value) {
      // Get collection info
      try {
        const collectionInfo = await client.describeCollection({
          collection_name: collectionName,
        });
        console.log("Collection schema:");
        collectionInfo.schema.fields.forEach((field: any) => {
          console.log(
            `  - ${field.name}: ${field.data_type} ${
              field.is_primary_key ? "(PRIMARY)" : ""
            }`
          );
        });
      } catch (error) {
        console.log("Could not get collection info:", error);
      }

      // Check collection load status
      try {
        const loadState = await client.getLoadState({
          collection_name: collectionName,
        });
        console.log(`Load state: ${loadState.state}`);
      } catch (error) {
        console.log("Could not get load state:", error);
      }

      // Try a simple insert using the raw client
      console.log("\n🧪 Testing direct insert...");

      const testData = [
        {
          id: `debug_test_${Date.now()}`,
          project_id: "debug",
          embedding: [0.1, 0.2, 0.3, 0.4], // Simple 4D vector
        },
      ];

      try {
        const insertResult = await client.insert({
          collection_name: collectionName,
          data: testData,
        });
        console.log("Insert result:", insertResult);

        // Force flush to ensure data is persisted
        await client.flush({
          collection_names: [collectionName],
        });
        console.log("✅ Flushed data to disk");

        // Wait and check stats
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const stats = await client.getCollectionStatistics({
          collection_name: collectionName,
        });
        console.log("Collection stats after insert:", stats);

        // Try to query the data
        const queryResult = await client.query({
          collection_name: collectionName,
          filter: `id == "${testData[0].id}"`,
          output_fields: ["id", "project_id"],
          limit: 10,
        });

        console.log("Query result:", queryResult);

        if (queryResult.data && queryResult.data.length > 0) {
          console.log("✅ SUCCESS! Vector was inserted and can be queried");

          // Now try search
          const searchResult = await client.search({
            collection_name: collectionName,
            vectors: [[0.1, 0.2, 0.3, 0.4]],
            search_params: {
              anns_field: "embedding",
              topk: 5,
              metric_type: MetricType.COSINE,
              params: { nprobe: 10 },
            },
            output_fields: ["id", "project_id"],
          });

          console.log("Search result:", searchResult);

          if (searchResult.results && searchResult.results.length > 0) {
            console.log("✅ SUCCESS! Search is working too!");
            return true;
          } else {
            console.log("⚠️  Insert works but search doesn't return results");
            return true; // Still a success for the core functionality
          }
        } else {
          console.log(
            "❌ Insert appeared to work but query returns no results"
          );
          return false;
        }
      } catch (insertError: any) {
        console.log("❌ Insert failed:", insertError.message);
        return false;
      }
    } else {
      console.log("❌ Collection does not exist");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Debug failed:", error.message);
    return false;
  }
}

debugCollection()
  .then((success) => {
    console.log(
      success ? "\n✅ Debug completed successfully" : "\n❌ Debug found issues"
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Debug runner failed:", error);
    process.exit(1);
  });
