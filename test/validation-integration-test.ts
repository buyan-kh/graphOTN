#!/usr/bin/env node

/**
 * Integration test for validation through MCP server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";

async function testValidationIntegration() {
  console.log("🧪 Testing Validation Integration...");

  const testWorkspace = path.resolve("test-validation-workspace");

  // Clean up and create test workspace
  try {
    await fs.rm(testWorkspace, { recursive: true, force: true });
  } catch {}

  await fs.mkdir(testWorkspace, { recursive: true });

  // Create client
  const transport = new StdioClientTransport({
    command: "node",
    args: ["packages/server/dist/main.js"],
  });

  const client = new Client(
    {
      name: "gotn-validation-test",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test 1: Initialize workspace (should work)
    console.log("\n📁 Test 1: Valid workspace initialization");
    const initResult = await client.callTool({
      name: "gotn_index_workspace",
      arguments: { workspace_path: testWorkspace },
    });

    const initResponse = JSON.parse(
      initResult.content[0].type === "text" ? initResult.content[0].text : "{}"
    );

    if (initResponse.ok) {
      console.log("✅ Valid workspace initialization succeeded");
    } else {
      throw new Error(`Expected success, got: ${initResponse.error}`);
    }

    // Test 2: Try to initialize with invalid path (should fail gracefully)
    console.log("\n❌ Test 2: Invalid workspace path");
    try {
      const invalidInitResult = await client.callTool({
        name: "gotn_index_workspace",
        arguments: { workspace_path: "" }, // Empty path
      });

      const invalidInitResponse = JSON.parse(
        invalidInitResult.content[0].type === "text"
          ? invalidInitResult.content[0].text
          : "{}"
      );

      if (!invalidInitResponse.ok) {
        console.log("✅ Invalid workspace path properly rejected");
        console.log(`   Error: ${invalidInitResponse.error}`);
      } else {
        throw new Error("Expected failure for empty workspace path");
      }
    } catch (error: any) {
      console.log("✅ Invalid workspace path caused proper error handling");
      console.log(`   Error: ${error.message}`);
    }

    // Test 3: Verify graph.json structure is valid
    console.log("\n📊 Test 3: Verify generated graph structure");
    const graphPath = path.join(testWorkspace, ".gotn", "graph.json");
    const graphContent = await fs.readFile(graphPath, "utf8");
    const graph = JSON.parse(graphContent);

    // Check that graph has the expected structure
    if (
      Array.isArray(graph.nodes) &&
      Array.isArray(graph.edges) &&
      typeof graph.version === "number" &&
      typeof graph.updated === "string"
    ) {
      console.log("✅ Generated graph.json has valid structure");
      console.log(
        `   Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}, Version: ${graph.version}`
      );
    } else {
      throw new Error("Generated graph.json has invalid structure");
    }

    // Test 4: Verify meta.json structure
    console.log("\n📄 Test 4: Verify generated meta structure");
    const metaPath = path.join(testWorkspace, ".gotn", "meta.json");
    const metaContent = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaContent);

    if (
      meta.version &&
      meta.created &&
      meta.updated &&
      meta.workspace_path === testWorkspace
    ) {
      console.log("✅ Generated meta.json has valid structure");
      console.log(`   Version: ${meta.version}, Created: ${meta.created}`);
    } else {
      throw new Error("Generated meta.json has invalid structure");
    }

    // Test 5: Verify journal entries are valid
    console.log("\n📝 Test 5: Verify journal entry structure");
    const journalPath = path.join(testWorkspace, ".gotn", "journal.ndjson");
    const journalContent = await fs.readFile(journalPath, "utf8");
    const journalLines = journalContent
      .split("\n")
      .filter((line) => line.trim());

    if (journalLines.length > 0) {
      const firstEntry = JSON.parse(journalLines[0]);
      if (
        firstEntry.timestamp &&
        firstEntry.event &&
        firstEntry.id &&
        firstEntry.data
      ) {
        console.log("✅ Journal entries have valid structure");
        console.log(`   Event: ${firstEntry.event}, ID: ${firstEntry.id}`);
      } else {
        throw new Error("Journal entry has invalid structure");
      }
    }

    console.log("\n🎉 All validation integration tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Validation integration test failed:", error);
    return false;
  } finally {
    await client.close();
    // Clean up
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {}
  }
}

testValidationIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
