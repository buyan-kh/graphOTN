#!/usr/bin/env node

/**
 * Test script for GoTN storage functionality
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";

async function testStorage() {
  console.log("🧪 Testing GoTN Storage Layer...");

  const testWorkspace = path.resolve("test-workspace");
  console.log(`Test workspace: ${testWorkspace}`);

  // Clean up any existing .gotn directory
  try {
    await fs.rm(path.join(testWorkspace, ".gotn"), {
      recursive: true,
      force: true,
    });
    console.log("✅ Cleaned up existing .gotn directory");
  } catch {
    // Ignore if doesn't exist
  }

  // Create client
  const transport = new StdioClientTransport({
    command: "node",
    args: ["packages/server/dist/main.js"],
  });

  const client = new Client(
    {
      name: "gotn-storage-test",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test 1: Initialize workspace
    console.log("\n📁 Test 1: Initialize workspace");
    const initResult = await client.callTool({
      name: "gotn_index_workspace",
      arguments: { workspace_path: testWorkspace },
    });

    const initResponse = JSON.parse(
      initResult.content[0].type === "text" ? initResult.content[0].text : "{}"
    );
    console.log("Init response:", initResponse);

    if (initResponse.ok) {
      console.log("✅ Workspace initialized successfully");
    } else {
      throw new Error(`Initialization failed: ${initResponse.error}`);
    }

    // Test 2: Verify directory structure
    console.log("\n📂 Test 2: Verify directory structure");
    const gotnPath = path.join(testWorkspace, ".gotn");

    const expectedPaths = [
      ".gotn",
      ".gotn/meta.json",
      ".gotn/graph.json",
      ".gotn/journal.ndjson",
      ".gotn/locks",
      ".gotn/runs",
      ".gotn/cache",
    ];

    for (const expectedPath of expectedPaths) {
      const fullPath = path.join(testWorkspace, expectedPath);
      try {
        await fs.access(fullPath);
        console.log(`  ✅ ${expectedPath} exists`);
      } catch {
        throw new Error(`Missing: ${expectedPath}`);
      }
    }

    // Test 3: Check file contents
    console.log("\n📄 Test 3: Check file contents");

    // Check meta.json
    const metaContent = await fs.readFile(
      path.join(gotnPath, "meta.json"),
      "utf8"
    );
    const meta = JSON.parse(metaContent);
    console.log("Meta.json:", meta);

    if (meta.version && meta.workspace_path === testWorkspace) {
      console.log("  ✅ meta.json has correct structure");
    } else {
      throw new Error("meta.json structure is invalid");
    }

    // Check graph.json
    const graphContent = await fs.readFile(
      path.join(gotnPath, "graph.json"),
      "utf8"
    );
    const graph = JSON.parse(graphContent);
    console.log("Graph.json:", graph);

    if (
      Array.isArray(graph.nodes) &&
      Array.isArray(graph.edges) &&
      graph.version === 1
    ) {
      console.log("  ✅ graph.json has correct structure");
    } else {
      throw new Error("graph.json structure is invalid");
    }

    // Test 4: Test idempotency (initialize again)
    console.log("\n🔄 Test 4: Test idempotency");
    const secondInitResult = await client.callTool({
      name: "gotn_index_workspace",
      arguments: { workspace_path: testWorkspace },
    });

    const secondInitResponse = JSON.parse(
      secondInitResult.content[0].type === "text"
        ? secondInitResult.content[0].text
        : "{}"
    );
    console.log("Second init response:", secondInitResponse);

    if (
      secondInitResponse.ok &&
      secondInitResponse.message.includes("already initialized")
    ) {
      console.log("✅ Idempotency test passed");
    } else {
      throw new Error("Idempotency test failed");
    }

    // Test 5: Check journal entries
    console.log("\n📝 Test 5: Check journal entries");
    const journalContent = await fs.readFile(
      path.join(gotnPath, "journal.ndjson"),
      "utf8"
    );
    const journalLines = journalContent
      .split("\n")
      .filter((line) => line.trim());

    console.log(`Found ${journalLines.length} journal entries`);
    if (journalLines.length > 0) {
      const firstEntry = JSON.parse(journalLines[0]);
      console.log("First journal entry:", firstEntry);

      if (
        firstEntry.event === "workspace_initialized" &&
        firstEntry.timestamp &&
        firstEntry.id
      ) {
        console.log("✅ Journal entries have correct structure");
      } else {
        throw new Error("Journal entry structure is invalid");
      }
    }

    console.log("\n🎉 All storage tests passed!");
  } catch (error) {
    console.error("❌ Storage test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testStorage().catch(console.error);
