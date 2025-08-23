#!/usr/bin/env tsx

import { initStore, addNode } from "./packages/core/src/index.js";
import { rmSync, existsSync } from "fs";

const TEST_WORKSPACE = "/tmp/gotn-test-minimal";

async function testMinimal() {
  console.log("Testing minimal node storage...");

  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true, force: true });
  }

  try {
    await initStore(TEST_WORKSPACE);
    console.log("✅ Store initialized");

    const testNode = {
      id: "test_node",
      kind: "micro_prompt",
      summary: "Test node",
      prompt_text: "Test prompt",
      children: [],
      requires: [],
      produces: [],
      tags: [],
      success_criteria: [],
      guards: [],
      artifacts: { files: [], outputs: [], dependencies: [] },
      status: "ready" as const,
      provenance: { created_by: "test", source: "manual" },
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Calling addNode...");
    await addNode(TEST_WORKSPACE, testNode);
    console.log("✅ Node added successfully");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (existsSync(TEST_WORKSPACE)) {
      rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    }
  }
}

testMinimal();
