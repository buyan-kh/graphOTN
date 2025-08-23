#!/usr/bin/env node

/**
 * Simple concurrent test using require
 */

import {
  initStore,
  writeGraph,
  readGraph,
  appendJournal,
} from "../packages/core/dist/index.js";
import * as path from "path";
import * as fs from "fs/promises";

async function testConcurrentWrites() {
  console.log("🧪 Testing Concurrent Writes...");

  const testWorkspace = path.resolve("test-concurrent");

  // Clean up and create test workspace
  try {
    await fs.rm(testWorkspace, { recursive: true, force: true });
  } catch {}

  await fs.mkdir(testWorkspace, { recursive: true });
  await initStore(testWorkspace);

  console.log("✅ Test workspace initialized");

  // Test concurrent journal writes (simpler test)
  console.log("\n📝 Testing concurrent journal writes");

  const promises = [];
  const writeCount = 10;

  for (let i = 0; i < writeCount; i++) {
    promises.push(
      appendJournal(testWorkspace, {
        event: "test_event",
        data: { index: i },
      })
    );
  }

  await Promise.all(promises);
  console.log("✅ All concurrent journal writes completed");

  // Verify
  const journalPath = path.join(testWorkspace, ".gotn", "journal.ndjson");
  const journalContent = await fs.readFile(journalPath, "utf8");
  const journalLines = journalContent.split("\n").filter((line) => line.trim());

  console.log(`Journal has ${journalLines.length} entries`);

  if (journalLines.length === writeCount + 1) {
    // +1 for init entry
    console.log("✅ Concurrent writes succeeded - all entries present");
  } else {
    throw new Error(
      `Expected ${writeCount + 1} entries, got ${journalLines.length}`
    );
  }

  console.log("\n🎉 Concurrent write test passed!");

  // Clean up
  await fs.rm(testWorkspace, { recursive: true, force: true });
}

testConcurrentWrites().catch(console.error);
