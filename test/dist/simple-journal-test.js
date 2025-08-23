#!/usr/bin/env node
/**
 * Simple journal test
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";
async function testSimpleJournal() {
    console.log("🧪 Testing Simple Journal...");
    const testWorkspace = path.resolve("test-simple-journal");
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
        name: "gotn-simple-journal-test",
        version: "0.1.0",
    }, {
        capabilities: {},
    });
    try {
        await client.connect(transport);
        console.log("✅ Connected to MCP server");
        // Initialize workspace
        console.log("\n📁 Initializing workspace");
        const initResult = await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        const initResponse = JSON.parse(initResult.content[0].type === "text" ? initResult.content[0].text : "{}");
        if (initResponse.ok) {
            console.log("✅ Workspace initialized");
        }
        else {
            throw new Error(`Initialization failed: ${initResponse.error}`);
        }
        // Check journal exists
        const journalPath = path.join(testWorkspace, ".gotn", "journal.ndjson");
        const journalContent = await fs.readFile(journalPath, "utf8");
        const journalLines = journalContent.split("\n").filter(line => line.trim());
        console.log(`📝 Journal has ${journalLines.length} entries after init`);
        // Delete graph.json
        console.log("\n💥 Deleting graph.json");
        const graphPath = path.join(testWorkspace, ".gotn", "graph.json");
        await fs.unlink(graphPath);
        // Try recovery
        console.log("\n🔄 Testing recovery");
        const recoveryResult = await client.callTool({
            name: "gotn_index_workspace",
            arguments: { workspace_path: testWorkspace },
        });
        const recoveryResponse = JSON.parse(recoveryResult.content[0].type === "text" ? recoveryResult.content[0].text : "{}");
        if (recoveryResponse.ok) {
            console.log("✅ Recovery completed");
            if (recoveryResponse.recovery_performed) {
                console.log("   Recovery was performed");
            }
        }
        else {
            throw new Error(`Recovery failed: ${recoveryResponse.error}`);
        }
        console.log("\n🎉 Simple journal test passed!");
        return true;
    }
    catch (error) {
        console.error("❌ Simple journal test failed:", error);
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
testSimpleJournal()
    .then((success) => {
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
});
