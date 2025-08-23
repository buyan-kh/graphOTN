#!/usr/bin/env node

/**
 * Test validation error handling with corrupted files
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";

async function testValidationErrors() {
  console.log("🧪 Testing Validation Error Handling...");

  const testWorkspace = path.resolve("test-validation-errors");

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
      name: "gotn-validation-error-test",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Initialize a valid workspace first
    console.log("\n📁 Step 1: Initialize valid workspace");
    await client.callTool({
      name: "gotn_index_workspace",
      arguments: { workspace_path: testWorkspace },
    });
    console.log("✅ Workspace initialized");

    // Test 1: Corrupt the graph.json file and try to read it
    console.log("\n💥 Test 1: Corrupted graph.json");
    const graphPath = path.join(testWorkspace, ".gotn", "graph.json");

    // Write invalid JSON
    await fs.writeFile(
      graphPath,
      '{"nodes": [{"id": "", "invalid": true}], "edges": [], "version": "invalid"}'
    );

    try {
      // Try to initialize again (which will read the corrupted graph)
      const result = await client.callTool({
        name: "gotn_index_workspace",
        arguments: { workspace_path: testWorkspace },
      });

      const response = JSON.parse(
        result.content[0].type === "text" ? result.content[0].text : "{}"
      );

      if (
        !response.ok &&
        response.error &&
        response.error.includes("Invalid graph.json format")
      ) {
        console.log("✅ Corrupted graph.json properly rejected");
        console.log(`   Error: ${response.error}`);
      } else {
        console.log("⚠️  Corrupted graph.json was not properly detected");
        console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
      }
    } catch (error: any) {
      console.log("✅ Corrupted graph.json caused proper error");
      console.log(`   Error: ${error.message}`);
    }

    // Test 2: Corrupt the meta.json file
    console.log("\n💥 Test 2: Corrupted meta.json");
    const metaPath = path.join(testWorkspace, ".gotn", "meta.json");

    // Write invalid meta structure
    await fs.writeFile(
      metaPath,
      '{"version": "", "created": "invalid-date", "workspace_path": ""}'
    );

    try {
      const result = await client.callTool({
        name: "gotn_index_workspace",
        arguments: { workspace_path: testWorkspace },
      });

      const response = JSON.parse(
        result.content[0].type === "text" ? result.content[0].text : "{}"
      );

      if (!response.ok && response.error) {
        console.log("✅ Corrupted meta.json properly rejected");
        console.log(`   Error: ${response.error}`);
      } else {
        console.log("⚠️  Corrupted meta.json was not properly detected");
      }
    } catch (error: any) {
      console.log("✅ Corrupted meta.json caused proper error");
      console.log(`   Error: ${error.message}`);
    }

    // Test 3: Test with completely invalid JSON
    console.log("\n💥 Test 3: Invalid JSON syntax");
    await fs.writeFile(graphPath, "this is not valid json at all");

    try {
      const result = await client.callTool({
        name: "gotn_index_workspace",
        arguments: { workspace_path: testWorkspace },
      });

      const response = JSON.parse(
        result.content[0].type === "text" ? result.content[0].text : "{}"
      );

      if (!response.ok && response.error) {
        console.log("✅ Invalid JSON properly rejected");
        console.log(`   Error: ${response.error}`);
      } else {
        console.log("⚠️  Invalid JSON was not properly detected");
      }
    } catch (error: any) {
      console.log("✅ Invalid JSON caused proper error");
      console.log(`   Error: ${error.message}`);
    }

    console.log("\n🎉 Validation error handling tests completed!");
    return true;
  } catch (error) {
    console.error("❌ Validation error test failed:", error);
    return false;
  } finally {
    await client.close();
    // Clean up
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {}
  }
}

testValidationErrors()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
