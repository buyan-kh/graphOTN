#!/usr/bin/env node
/**
 * Test node storage functionality
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";
async function testNodeStorage() {
    console.log("🧪 Testing Node Storage...");
    const testWorkspace = path.resolve("test-node-storage");
    // Clean up and create test workspace
    try {
        await fs.rm(testWorkspace, { recursive: true, force: true });
    }
    catch { }
    await fs.mkdir(testWorkspace, { recursive: true });
    // Create client
    const transport = new StdioClientTransport({
        command: "node",
        args: ["packages/server/dist/main.js"],
    });
    const client = new Client({
        name: "gotn-node-storage-test",
        version: "0.1.0",
    }, {
        capabilities: {},
    });
    try {
        await client.connect(transport);
        console.log("✅ Connected to MCP server");
        // Initialize workspace
        console.log("\n📁 Initializing workspace");
        await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        console.log("✅ Workspace initialized");
        // Create minimal valid node
        const minimalNode = {
            id: "minimal-node-1",
            kind: "test",
            summary: "Minimal test node",
            prompt_text: "This is a minimal test prompt",
            provenance: {
                created_by: "test",
                source: "node-storage-test"
            }
        };
        console.log("\n📝 Storing minimal node");
        console.log("Node data:", JSON.stringify(minimalNode, null, 2));
        const storeResult = await client.callTool({
            name: "gotn_store_node",
            arguments: {
                node: minimalNode,
                workspace_path: testWorkspace
            },
        });
        const storeResponse = JSON.parse(storeResult.content[0].type === "text" ? storeResult.content[0].text : "{}");
        if (storeResponse.ok) {
            console.log("✅ Node stored successfully");
            console.log(`   Node ID: ${storeResponse.node_id}`);
        }
        else {
            console.log("❌ Node storage failed");
            console.log("Response:", JSON.stringify(storeResponse, null, 2));
        }
        console.log("\n🎉 Node storage test completed!");
        return true;
    }
    catch (error) {
        console.error("❌ Node storage test failed:", error);
        return false;
    }
    finally {
        await client.close();
        // Clean up
        try {
            await fs.rm(testWorkspace, { recursive: true, force: true });
        }
        catch { }
    }
}
testNodeStorage()
    .then((success) => {
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
});
