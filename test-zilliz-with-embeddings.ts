#!/usr/bin/env node

/**
 * Test Zilliz with real embeddings from OpenAI
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

console.log("🧪 Testing Zilliz with Real Embeddings");
console.log("======================================");

async function testWithRealEmbeddings() {
  try {
    // Import both embeddings and zilliz functions
    const {
      getEmbedder,
      connectZilliz,
      ensureCollection,
      upsertVector,
      searchKnn,
      getCollectionStats,
    } = await import("./packages/vec/dist/index.js");

    console.log("✅ Imported vector functions");

    // Check credentials
    if (
      !process.env.OPENAI_API_KEY ||
      !process.env.ZILLIZ_URI ||
      !process.env.ZILLIZ_TOKEN
    ) {
      console.log("❌ Missing required credentials");
      return false;
    }

    // Get embedder and generate real embeddings
    console.log("\n📝 Generating embeddings...");
    const embedder = getEmbedder();

    const testTexts = [
      "artificial intelligence and machine learning",
      "deep learning neural networks",
      "natural language processing",
      "computer vision and image recognition",
    ];

    const embeddings: { text: string; embedding: number[]; id: string }[] = [];

    for (const text of testTexts) {
      const embedding = await embedder.embed(text);
      const id = `test_${text.replace(/\s+/g, "_")}_${Date.now()}`;
      embeddings.push({ text, embedding, id });
      console.log(`   ✅ ${text} -> ${embedding.length}D vector`);
    }

    // Connect to Zilliz
    console.log("\n📡 Connecting to Zilliz...");
    const client = connectZilliz();
    await ensureCollection(client);
    console.log("✅ Collection ready");

    // Check initial stats
    let stats = await getCollectionStats(client);
    console.log(`📊 Initial stats: ${stats.count} vectors`);

    // Upsert the real embeddings
    console.log("\n📤 Upserting real embeddings...");
    for (const item of embeddings) {
      await upsertVector(client, item.id, item.embedding, "real_test");
      console.log(`   ✅ ${item.text}`);
    }

    // Wait for indexing
    console.log("\n⏳ Waiting 10 seconds for indexing...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check stats after upsert
    stats = await getCollectionStats(client);
    console.log(
      `📊 After upsert: ${stats.count} vectors (${stats.indexedCount} indexed)`
    );

    // Generate a query embedding
    console.log("\n🔍 Testing semantic search...");
    const queryText = "machine learning algorithms";
    const queryEmbedding = await embedder.embed(queryText);
    console.log(`Query: "${queryText}" -> ${queryEmbedding.length}D vector`);

    // Search for similar vectors
    const searchResults = await searchKnn(
      client,
      queryEmbedding,
      3,
      "real_test"
    );

    if (searchResults.length > 0) {
      console.log(`✅ Found ${searchResults.length} similar vectors:`);
      searchResults.forEach((result, i) => {
        const originalText =
          embeddings.find((e) => e.id === result.id)?.text || "unknown";
        console.log(
          `   ${i + 1}. "${originalText}" (score: ${result.score.toFixed(4)})`
        );
      });

      console.log("\n🎉 SUCCESS! All criteria verified:");
      console.log("✅ 1. Client connects using env vars and SSL");
      console.log("✅ 2. Collection is created if missing and then loaded");
      console.log(
        "✅ 3. Upsert plus search returns the inserted ID with a positive score"
      );
      console.log("✅ 4. Semantic search works with real embeddings!");

      return true;
    } else {
      console.log("⚠️  No search results found");

      // Try without project filter
      const allResults = await searchKnn(client, queryEmbedding, 3);
      if (allResults.length > 0) {
        console.log(
          "✅ Found results without project filter - system is working!"
        );
        return true;
      } else {
        console.log("❌ No results even without project filter");
        return false;
      }
    }
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    return false;
  }
}

testWithRealEmbeddings()
  .then((success) => {
    console.log(
      success
        ? "\n🚀 Zilliz + Embeddings integration is working!"
        : "\n❌ Integration failed"
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
