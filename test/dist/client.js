#!/usr/bin/env node
/**
 * Simple MCP client to test GoTN server
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// No longer need spawn import
async function testGoTNServer() {
    console.log("🧪 Testing GoTN MCP Server...");
    // Create client with stdio transport that spawns the server
    const transport = new StdioClientTransport({
        command: "node",
        args: ["packages/server/dist/main.js"],
    });
    const client = new Client({
        name: "gotn-test-client",
        version: "0.1.0",
    }, {
        capabilities: {},
    });
    try {
        // Connect to server
        await client.connect(transport);
        console.log("✅ Connected to server");
        // List available tools
        console.log("\n📋 Listing tools...");
        const toolsResponse = await client.listTools();
        console.log(`Found ${toolsResponse.tools.length} tools:`);
        toolsResponse.tools.forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.name}: ${tool.description}`);
        });
        // Test each tool
        console.log("\n🔧 Testing each tool...");
        const expectedTools = [
            "gotn_index_workspace",
            "gotn_store_node",
            "gotn_infer_edges",
            "gotn_compose_plan",
            "gotn_execute_node",
            "gotn_trace_node"
        ];
        for (const toolName of expectedTools) {
            try {
                console.log(`\n  Testing ${toolName}...`);
                // Prepare test arguments based on tool
                let testArgs = {};
                switch (toolName) {
                    case "gotn_index_workspace":
                        testArgs = { workspace_path: "/test/path" };
                        break;
                    case "gotn_store_node":
                        testArgs = { node: { id: "test", kind: "test" } };
                        break;
                    case "gotn_infer_edges":
                    case "gotn_execute_node":
                    case "gotn_trace_node":
                        testArgs = { node_id: "test-node" };
                        break;
                    case "gotn_compose_plan":
                        testArgs = { target_nodes: ["node1", "node2"] };
                        break;
                }
                const result = await client.callTool({
                    name: toolName,
                    arguments: testArgs,
                });
                // Parse the response
                const responseText = result.content[0].type === "text" ? result.content[0].text : "";
                const parsedResponse = JSON.parse(responseText);
                if (parsedResponse.ok === true) {
                    console.log(`    ✅ ${toolName} returned ok: true`);
                }
                else {
                    console.log(`    ❌ ${toolName} returned ok: ${parsedResponse.ok}`);
                }
            }
            catch (error) {
                console.log(`    ❌ ${toolName} failed: ${error}`);
            }
        }
        console.log("\n🎉 All tests completed!");
    }
    catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
    finally {
        // Clean up
        await client.close();
        process.exit(0);
    }
}
testGoTNServer().catch(console.error);
