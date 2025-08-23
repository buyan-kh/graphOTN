#!/usr/bin/env node
/**
 * Test concurrent writes to verify locking mechanism
 */
import { initStore, writeGraph, readGraph, appendJournal } from "../packages/core/dist/index.js";
import * as path from "path";
import * as fs from "fs/promises";
async function testConcurrentWrites() {
    console.log("🧪 Testing Concurrent Writes...");
    const testWorkspace = path.resolve("test-concurrent");
    // Clean up and create test workspace
    try {
        await fs.rm(testWorkspace, { recursive: true, force: true });
    }
    catch { }
    await fs.mkdir(testWorkspace, { recursive: true });
    await initStore(testWorkspace);
    console.log("✅ Test workspace initialized");
    // Test 1: Concurrent graph writes
    console.log("\n📊 Test 1: Concurrent graph writes");
    const promises = [];
    const writeCount = 10;
    for (let i = 0; i < writeCount; i++) {
        promises.push((async (index) => {
            const graph = await readGraph(testWorkspace);
            // Add a test node
            graph.nodes.push({
                id: `test-node-${index}`,
                kind: "test",
                summary: `Test node ${index}`,
                prompt_text: `This is test node ${index}`,
                children: [],
                requires: [],
                produces: [`output-${index}`],
                tags: [`test-${index}`],
                success_criteria: [`node ${index} completes`],
                guards: [],
                artifacts: { files: [] },
                status: "ready",
                provenance: {
                    created_by: "concurrent-test",
                    source: "test",
                },
                version: 1,
            });
            await writeGraph(testWorkspace, graph);
            console.log(`  ✅ Write ${index} completed`);
        })(i));
    }
    await Promise.all(promises);
    // Verify all writes succeeded
    const finalGraph = await readGraph(testWorkspace);
    console.log(`Final graph has ${finalGraph.nodes.length} nodes`);
    if (finalGraph.nodes.length === writeCount) {
        console.log("✅ All concurrent writes succeeded");
    }
    else {
        throw new Error(`Expected ${writeCount} nodes, got ${finalGraph.nodes.length}`);
    }
    // Test 2: Concurrent journal writes
    console.log("\n📝 Test 2: Concurrent journal writes");
    const journalPromises = [];
    const journalWriteCount = 20;
    for (let i = 0; i < journalWriteCount; i++) {
        journalPromises.push(appendJournal(testWorkspace, {
            event: "test_event",
            data: { index: i, message: `Test event ${i}` },
        }));
    }
    await Promise.all(journalPromises);
    // Read journal and verify
    const journalPath = path.join(testWorkspace, '.gotn', 'journal.ndjson');
    const journalContent = await fs.readFile(journalPath, 'utf8');
    const journalLines = journalContent.split('\n').filter(line => line.trim());
    console.log(`Journal has ${journalLines.length} entries`);
    // Should have: 1 init entry + journalWriteCount test entries
    const expectedJournalEntries = 1 + journalWriteCount;
    if (journalLines.length === expectedJournalEntries) {
        console.log("✅ All concurrent journal writes succeeded");
    }
    else {
        throw new Error(`Expected ${expectedJournalEntries} journal entries, got ${journalLines.length}`);
    }
    // Verify journal entries are valid JSON
    let testEventCount = 0;
    for (const line of journalLines) {
        const entry = JSON.parse(line);
        if (entry.event === "test_event") {
            testEventCount++;
        }
        if (!entry.timestamp || !entry.id) {
            throw new Error("Journal entry missing required fields");
        }
    }
    if (testEventCount === journalWriteCount) {
        console.log("✅ All journal entries are valid");
    }
    else {
        throw new Error(`Expected ${journalWriteCount} test events, found ${testEventCount}`);
    }
    console.log("\n🎉 All concurrent write tests passed!");
    // Clean up
    await fs.rm(testWorkspace, { recursive: true, force: true });
}
testConcurrentWrites().catch((error) => {
    console.error("❌ Concurrent write test failed:", error);
    process.exit(1);
});
