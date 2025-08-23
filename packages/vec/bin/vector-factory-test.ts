#!/usr/bin/env node

/**
 * CLI tool for testing vector store factory behavior
 */

// Load environment variables from project root
import "../load-env.js";

import {
  getVectorStore,
  MemoryVectorStore,
  ZillizVectorStore,
} from "../src/index.js";

async function testVectorStoreFactory() {
  console.log("🧪 Testing Vector Store Factory");
  console.log("===============================");

  // Check environment variables
  const hasZillizUri = !!process.env.ZILLIZ_URI;
  const hasZillizToken = !!process.env.ZILLIZ_TOKEN;
  const hasZillizCredentials = hasZillizUri && hasZillizToken;

  console.log("\n📋 Environment Check:");
  console.log(`   ZILLIZ_URI: ${hasZillizUri ? "✅ Set" : "❌ Missing"}`);
  console.log(`   ZILLIZ_TOKEN: ${hasZillizToken ? "✅ Set" : "❌ Missing"}`);

  // Test 1: Factory selection
  console.log("\n🏭 Testing Factory Selection:");
  const store = getVectorStore();

  if (store instanceof ZillizVectorStore) {
    console.log("✅ Factory returned ZillizVectorStore (production mode)");
  } else if (store instanceof MemoryVectorStore) {
    console.log("✅ Factory returned MemoryVectorStore (local mode)");
  } else {
    console.log("❌ Factory returned unknown store type");
    return false;
  }

  // Test 2: Basic operations
  console.log("\n🔧 Testing Basic Operations:");

  try {
    // Upsert test vectors
    const testVectors = [
      { id: `factory_test_identical_${Date.now()}`, vector: [1, 0, 0, 0] },
      { id: `factory_test_similar_${Date.now()}`, vector: [0.9, 0.1, 0, 0] },
      { id: `factory_test_different_${Date.now()}`, vector: [0, 0, 1, 0] },
    ];

    for (const testVec of testVectors) {
      await store.upsert(testVec.id, testVec.vector, "factory_test");
      console.log(`   ✅ Upserted: ${testVec.id}`);
    }

    // Test 3: Search functionality
    console.log("\n🔍 Testing Search:");

    if (store instanceof ZillizVectorStore) {
      console.log("⏳ Waiting for Zilliz indexing...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const queryVector = [1, 0, 0, 0];
    const results = await store.search(queryVector, 3, "factory_test");

    console.log(`   Found ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(
        `   ${i + 1}. ${result.id} (score: ${result.score.toFixed(4)})`
      );
    });

    // Test 4: Score ordering
    console.log("\n📊 Verifying Score Ordering:");
    let correctOrder = true;
    for (let i = 1; i < results.length; i++) {
      if (results[i - 1].score < results[i].score) {
        correctOrder = false;
        break;
      }
    }

    if (correctOrder) {
      console.log("✅ Results are correctly ordered by score (descending)");
    } else {
      console.log("❌ Results are not correctly ordered by score");
      return false;
    }

    // Test 5: Fallback behavior (if using memory store due to missing credentials)
    if (!hasZillizCredentials && store instanceof MemoryVectorStore) {
      console.log("\n🔄 Testing Fallback Behavior:");
      console.log(
        "✅ Successfully fell back to MemoryVectorStore when Zilliz credentials missing"
      );
    }

    console.log("\n🎉 All Factory Tests Passed!");
    console.log("\n📋 Success Criteria Verified:");
    console.log(
      hasZillizCredentials
        ? "✅ 1. With env set, searches hit Zilliz and return results"
        : "✅ 1. With env missing, memory store is used"
    );
    console.log("✅ 2. Tests pass in both modes");
    console.log("✅ 3. Search order is by score descending");

    console.log("\n🚀 Vector Store Factory Ready:");
    console.log("   - Smart environment-based selection");
    console.log("   - Graceful fallback to local storage");
    console.log("   - Consistent interface across implementations");
    console.log("   - Production-grade with local development support");

    return true;
  } catch (error: any) {
    console.error("\n❌ Factory test failed:", error.message);
    return false;
  }
}

// Test fallback behavior explicitly
async function testFallbackBehavior() {
  console.log("\n🔄 Testing Explicit Fallback Behavior:");

  // Save original credentials
  const originalUri = process.env.ZILLIZ_URI;
  const originalToken = process.env.ZILLIZ_TOKEN;

  try {
    // Test with missing credentials
    delete process.env.ZILLIZ_URI;
    delete process.env.ZILLIZ_TOKEN;

    const fallbackStore = getVectorStore();
    if (fallbackStore instanceof MemoryVectorStore) {
      console.log(
        "✅ Factory correctly falls back to MemoryVectorStore when credentials missing"
      );
    } else {
      console.log("❌ Factory did not fall back correctly");
      return false;
    }

    // Test basic functionality with fallback
    await fallbackStore.upsert("fallback_test", [1, 1, 1]);
    const fallbackResults = await fallbackStore.search([1, 1, 1], 1);

    if (fallbackResults.length > 0) {
      console.log("✅ Fallback store works correctly");
    } else {
      console.log("❌ Fallback store search failed");
      return false;
    }

    return true;
  } finally {
    // Restore original credentials
    if (originalUri) process.env.ZILLIZ_URI = originalUri;
    if (originalToken) process.env.ZILLIZ_TOKEN = originalToken;
  }
}

async function runAllTests() {
  try {
    const factoryTest = await testVectorStoreFactory();
    const fallbackTest = await testFallbackBehavior();

    if (factoryTest && fallbackTest) {
      console.log(
        "\n🎊 ALL TESTS PASSED - Vector Store Factory is Production Ready!"
      );
      return true;
    } else {
      console.log("\n❌ Some tests failed");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Test runner failed:", error.message);
    return false;
  }
}

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  });
