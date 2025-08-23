#!/usr/bin/env node

/**
 * CLI tool for manual vector store testing
 */

import { getVectorStore } from "../src/index.js";

async function testVectorStore() {
  console.log("🧪 Manual Vector Store Test");
  console.log("===========================");

  const store = getVectorStore();

  // Add some test vectors
  console.log("\n📝 Adding test vectors...");
  await store.upsert("north", [0, 1, 0]);
  await store.upsert("east", [1, 0, 0]);
  await store.upsert("south", [0, -1, 0]);
  await store.upsert("west", [-1, 0, 0]);
  await store.upsert("northeast", [0.707, 0.707, 0]);

  console.log("   Added 5 directional vectors");

  // Test search
  console.log("\n🔍 Searching for vectors similar to [1, 0, 0] (east)...");
  const query = [1, 0, 0];
  const results = await store.search(query, 3);

  console.log(`   Found ${results.length} results:`);
  results.forEach((result, i) => {
    console.log(`   ${i + 1}. ${result.id}: ${result.score.toFixed(4)}`);
  });

  // Test with project isolation
  console.log("\n📁 Testing project isolation...");
  await store.upsert("vec1", [1, 0, 0], "projectA");
  await store.upsert("vec2", [0, 1, 0], "projectA");
  await store.upsert("vec1", [0, 0, 1], "projectB");

  const projectAResults = await store.search([1, 0, 0], 5, "projectA");
  const projectBResults = await store.search([1, 0, 0], 5, "projectB");

  console.log(`   Project A results: ${projectAResults.length}`);
  console.log(`   Project B results: ${projectBResults.length}`);

  console.log("\n✅ Vector store test completed!");
}

testVectorStore().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
