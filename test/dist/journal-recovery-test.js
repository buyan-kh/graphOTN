#!/usr/bin/env node
/**
 * Test journal and recovery functionality
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";
async function testJournalAndRecovery() {
    console.log("🧪 Testing Journal and Recovery...");
    const testWorkspace = path.resolve("test-journal-recovery");
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
        name: "gotn-journal-recovery-test",
        version: "0.1.0",
    }, {
        capabilities: {},
    });
    try {
        await client.connect(transport);
        console.log("✅ Connected to MCP server");
        // Test 1: Initialize workspace
        console.log("\n📁 Test 1: Initialize workspace");
        const initResult = await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        const initResponse = JSON.parse(initResult.content[0].type === "text" ? initResult.content[0].text : "{}");
        if (initResponse.ok) {
            console.log("✅ Workspace initialized successfully");
        }
        else {
            throw new Error(`Initialization failed: ${initResponse.error}`);
        }
        // Test 2: Add a test node (this should create journal entries)
        console.log("\n📝 Test 2: Add test node");
        const testNode = {
            id: "test-node-1",
            kind: "micro_prompt",
            summary: "Test node for journal testing",
            prompt_text: "This is a test prompt for journal functionality",
            children: [],
            requires: ["input-data"],
            produces: ["output-data"],
            tags: ["test", "journal"],
            success_criteria: ["node completes successfully"],
            guards: ["check input exists"],
            artifacts: {
                files: ["test.txt"],
                outputs: [],
                dependencies: []
            },
            status: "ready",
            provenance: {
                created_by: "journal-test",
                source: "test-suite"
            },
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const storeResult = await client.callTool({
            name: "gotn_store_node",
            arguments: {
                node: testNode,
                workspace_path: testWorkspace
            },
        });
        const storeResponse = JSON.parse(storeResult.content[0].type === "text" ? storeResult.content[0].text : "{}");
        if (storeResponse.ok) {
            console.log("✅ Node stored successfully");
            console.log(`   Node ID: ${storeResponse.node_id}`);
        }
        else {
            throw new Error(`Node storage failed: ${storeResponse.error}`);
        }
        // Test 3: Verify journal has grown
        console.log("\n📊 Test 3: Verify journal growth");
        const journalPath = path.join(testWorkspace, ".gotn", "journal.ndjson");
        const journalContent = await fs.readFile(journalPath, "utf8");
        const journalLines = journalContent.split("\n").filter(line => line.trim());
        console.log(`Journal has ${journalLines.length} entries`);
        if (journalLines.length >= 2) { // Should have workspace_initialized + add_node
            console.log("✅ Journal grew after storing node");
            // Check for add_node event
            const addNodeEntry = journalLines.find(line => {
                const entry = JSON.parse(line);
                return entry.event === "add_node";
            });
            if (addNodeEntry) {
                console.log("✅ Found add_node event in journal");
                const entry = JSON.parse(addNodeEntry);
                console.log(`   Event: ${entry.event}, Node ID: ${entry.data.node.id}`);
            }
            else {
                throw new Error("add_node event not found in journal");
            }
        }
        else {
            throw new Error(`Expected at least 2 journal entries, got ${journalLines.length}`);
        }
        // Test 4: Verify graph has the node
        console.log("\n🔍 Test 4: Verify node in graph");
        const graphPath = path.join(testWorkspace, ".gotn", "graph.json");
        const graphContent = await fs.readFile(graphPath, "utf8");
        const graph = JSON.parse(graphContent);
        if (graph.nodes.length === 1 && graph.nodes[0].id === "test-node-1") {
            console.log("✅ Node found in graph");
        }
        else {
            throw new Error(`Expected 1 node in graph, got ${graph.nodes.length}`);
        }
        // Test 5: Delete graph.json and test recovery
        console.log("\n💥 Test 5: Delete graph.json and test recovery");
        await fs.unlink(graphPath);
        console.log("   Deleted graph.json");
        // Try to initialize again (should trigger recovery)
        const recoveryResult = await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        const recoveryResponse = JSON.parse(recoveryResult.content[0].type === "text" ? recoveryResult.content[0].text : "{}");
        if (recoveryResponse.ok) {
            console.log("✅ Recovery completed successfully");
            if (recoveryResponse.recovery_performed) {
                console.log("   Recovery was performed");
            }
            console.log(`   Recovered nodes: ${recoveryResponse.nodes_count}`);
            console.log(`   Recovered edges: ${recoveryResponse.edges_count}`);
            if (recoveryResponse.nodes_count === 1) {
                console.log("✅ Node recovered from journal");
            }
            else {
                throw new Error(`Expected 1 recovered node, got ${recoveryResponse.nodes_count}`);
            }
        }
        else {
            throw new Error(`Recovery failed: ${recoveryResponse.error}`);
        }
        // Test 6: Verify recovered graph content
        console.log("\n🔍 Test 6: Verify recovered graph content");
        const recoveredGraphContent = await fs.readFile(graphPath, "utf8");
        const recoveredGraph = JSON.parse(recoveredGraphContent);
        if (recoveredGraph.nodes.length === 1 && recoveredGraph.nodes[0].id === "test-node-1") {
            console.log("✅ Recovered graph contains original node");
            console.log(`   Node summary: ${recoveredGraph.nodes[0].summary}`);
        }
        else {
            throw new Error("Recovered graph does not match expected content");
        }
        // Test 7: Corrupt graph.json and test recovery
        console.log("\n💥 Test 7: Corrupt graph.json and test recovery");
        await fs.writeFile(graphPath, "invalid json content");
        console.log("   Corrupted graph.json");
        // Try to initialize again (should trigger recovery from corruption)
        const corruptionRecoveryResult = await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        const corruptionRecoveryResponse = JSON.parse(corruptionRecoveryResult.content[0].type === "text" ? corruptionRecoveryResult.content[0].text : "{}");
        if (corruptionRecoveryResponse.ok) {
            console.log("✅ Recovery from corruption completed successfully");
            if (corruptionRecoveryResponse.recovery_performed) {
                console.log("   Recovery was performed");
            }
            if (corruptionRecoveryResponse.nodes_count === 1) {
                console.log("✅ Node recovered from corruption");
            }
            else {
                throw new Error(`Expected 1 recovered node, got ${corruptionRecoveryResponse.nodes_count}`);
            }
        }
        else {
            throw new Error(`Recovery from corruption failed: ${corruptionRecoveryResponse.error}`);
        }
        console.log("\n🎉 All journal and recovery tests passed!");
        return true;
    }
    catch (error) {
        console.error("❌ Journal and recovery test failed:", error);
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
testJournalAndRecovery()
    .then((success) => {
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
});
