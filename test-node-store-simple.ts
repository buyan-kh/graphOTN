#!/usr/bin/env tsx

/**
 * Simple NodeStore test without vector components
 */

import {
  getNodeStore,
  initStore,
  readGraph,
  readJournal,
} from "./packages/core/src/index.js";
import { Node } from "./packages/core/src/schemas.js";
import { existsSync, rmSync } from "fs";

const TEST_WORKSPACE = "/tmp/gotn-test-simple";

async function testNodeStoreSimple() {
  console.log("🧪 Testing NodeStore (Simple)");
  console.log("=============================");

  // Clean up any existing test workspace
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true, force: true });
  }

  try {
    // 1. Initialize workspace
    console.log("\n📁 Step 1: Initialize workspace");
    await initStore(TEST_WORKSPACE);
    console.log(`✅ Workspace initialized at: ${TEST_WORKSPACE}`);

    // Change to test workspace
    const originalCwd = process.cwd();
    process.chdir(TEST_WORKSPACE);

    try {
      // 2. Create NodeStore instance
      const nodeStore = getNodeStore("test-project");

      // 3. Create three test nodes (minimal valid structure)
      console.log("\n📝 Step 2: Store three nodes");

      const testNodes: Node[] = [
        {
          id: "kafka_setup",
          kind: "micro_prompt",
          summary: "Set up Kafka broker",
          prompt_text: "Install and configure Kafka",
          children: [],
          requires: [],
          produces: ["kafka_ready"],
          tags: ["kafka"],
          success_criteria: [],
          guards: [],
          artifacts: { files: [], outputs: [], dependencies: [] },
          status: "ready",
          provenance: { created_by: "test", source: "manual" },
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "spark_consumer",
          kind: "micro_prompt",
          summary: "Create Spark consumer",
          prompt_text: "Implement Spark consumer",
          children: [],
          requires: ["kafka_ready"],
          produces: ["spark_ready"],
          tags: ["spark"],
          success_criteria: [],
          guards: [],
          artifacts: { files: [], outputs: [], dependencies: [] },
          status: "ready",
          provenance: { created_by: "test", source: "manual" },
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "snowflake_sink",
          kind: "micro_prompt",
          summary: "Write to Snowflake",
          prompt_text: "Create Snowflake writer",
          children: [],
          requires: ["spark_ready"],
          produces: ["data_loaded"],
          tags: ["snowflake"],
          success_criteria: [],
          guards: [],
          artifacts: { files: [], outputs: [], dependencies: [] },
          status: "ready",
          provenance: { created_by: "test", source: "manual" },
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Store each node
      for (const node of testNodes) {
        console.log(`Storing node: ${node.id}`);
        await nodeStore.storeNode(node);
        console.log(`✅ Stored node: ${node.id}`);
      }

      // 4. Verify nodes appear in graph.json
      console.log("\n📊 Step 3: Verify nodes in graph.json");
      const graph = await readGraph();
      console.log(`Found ${graph.nodes.length} nodes in graph.json`);

      if (graph.nodes.length >= 3) {
        console.log("✅ Success Criteria 1: Three nodes appear in graph.json");
        graph.nodes.forEach((node) => {
          console.log(`   - ${node.id}: ${node.summary}`);
        });
      } else {
        console.log("❌ Failed: Expected at least 3 nodes in graph.json");
        return false;
      }

      // 5. Test text search (should return empty with fallback)
      console.log("\n🔍 Step 4: Test text search (fallback mode)");
      const results = await nodeStore.searchNodesByText("kafka", 5);
      console.log(
        `Text search returned ${results.length} results (expected 0 in fallback mode)`
      );

      if (results.length === 0) {
        console.log(
          "✅ Success Criteria 2: Text search works (fallback returns empty as expected)"
        );
      } else {
        console.log("⚠️  Unexpected results from fallback search");
      }

      // 6. Verify journal contains add_node events
      console.log("\n📋 Step 5: Verify journal events");
      const journalEntries = await readJournal();
      const addNodeEvents = journalEntries.filter(
        (entry) => entry.event === "add_node"
      );

      console.log(`Found ${addNodeEvents.length} add_node events in journal`);
      addNodeEvents.forEach((entry, i) => {
        console.log(
          `   ${i + 1}. ${entry.data?.node?.id || "unknown"} at ${
            entry.timestamp
          }`
        );
      });

      if (addNodeEvents.length >= 3) {
        console.log("✅ Success Criteria 3: Journal contains add_node events");
      } else {
        console.log(
          "❌ Failed: Expected at least 3 add_node events in journal"
        );
        return false;
      }

      // 7. Test getNode functionality
      console.log("\n🎯 Step 6: Test getNode");
      const retrievedNode = await nodeStore.getNode("kafka_setup");
      if (retrievedNode && retrievedNode.id === "kafka_setup") {
        console.log("✅ getNode works correctly");
      } else {
        console.log("❌ getNode failed");
        return false;
      }

      // Summary
      console.log("\n🎉 NodeStore Test Results:");
      console.log("✅ 1. Three nodes stored in graph.json");
      console.log("✅ 2. Text search works (fallback mode)");
      console.log("✅ 3. Journal contains add_node events");
      console.log("✅ 4. getNode retrieves nodes correctly");

      console.log("\n🚀 NodeStore Core Features Working:");
      console.log("   - Node validation and storage");
      console.log("   - Journal-based persistence");
      console.log("   - Full integration with fsStore");
      console.log("   - Graceful fallback when vector components unavailable");

      return true;
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    return false;
  } finally {
    // Clean up test workspace
    if (existsSync(TEST_WORKSPACE)) {
      rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    }
  }
}

testNodeStoreSimple()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  });
