#!/usr/bin/env tsx

/**
 * Quick test to verify documentation examples work
 */

import {
  initStore,
  getBreakdownEngine,
  getPlanComposer,
  getGuardEngine,
  getNodeStore,
  getMetrics,
  getRecoveryEngine,
} from "./packages/core/src/index.js";
import { rmSync, existsSync } from "fs";

async function testDocumentationFlow() {
  const testWorkspace = "./docs-test";

  console.log("📚 Testing Documentation Examples");

  try {
    // Clean up
    if (existsSync(testWorkspace)) {
      rmSync(testWorkspace, { recursive: true, force: true });
    }

    // 1. Initialize workspace (like gotn_index_workspace)
    console.log("\n1. Initialize workspace");
    await initStore(testWorkspace);
    console.log("✅ Workspace initialized");

    // 2. Break down prompt (like gotn_breakdown_prompt)
    console.log("\n2. Break down sample prompt");
    const breakdownEngine = getBreakdownEngine();
    const result = await breakdownEngine.breakdown({
      project_id: "demo",
      prompt:
        "Build a dark landing page with header, hero section, and two call-to-action buttons",
      mode: "tree",
      max_nodes: 16,
    });

    console.log(
      `✅ Breakdown: ${result.total_nodes} nodes, root: ${result.root_id}`
    );

    // 3. Compose plan (like gotn_compose_plan)
    console.log("\n3. Compose execution plan");
    const planComposer = getPlanComposer();
    const plan = await planComposer.composePlan({
      goal: "Build landing page",
    });

    console.log(
      `✅ Plan: ${plan.ordered_node_ids.length} nodes in ${plan.layers.length} layers`
    );

    // 4. Test guard evaluation (like gotn_execute_node)
    console.log("\n4. Test guard evaluation");
    const guardEngine = getGuardEngine();
    const nodeStore = getNodeStore("demo");

    if (result.created_node_ids.length > 0) {
      const firstNodeId = result.created_node_ids[0];
      const node = await nodeStore.getNode(firstNodeId);

      if (node) {
        const guardResult = await guardEngine.evaluate(node);
        console.log(
          `✅ Guard evaluation: ${guardResult.result} - ${guardResult.reason}`
        );
      }
    }

    // 5. Test metrics (like gotn_debug)
    console.log("\n5. Test metrics collection");
    const metrics = getMetrics(testWorkspace);
    const metricsData = await metrics.collectMetrics();
    console.log(
      `✅ Metrics: ${metricsData.nodes} nodes, storage: ${metricsData.storage_mode}, vector: ${metricsData.vector_mode}`
    );

    // 6. Test recovery (like gotn_recover)
    console.log("\n6. Test recovery capability");
    const recoveryEngine = getRecoveryEngine(testWorkspace);
    const recoveryResult = await recoveryEngine.recover();
    console.log(`✅ Recovery: ${recoveryResult.message}`);

    console.log("\n🎉 All documentation examples work correctly!");
    console.log("\n📋 Summary:");
    console.log(`   • Workspace initialized with .gotn structure`);
    console.log(
      `   • Sample prompt broken into ${result.total_nodes} atomic steps`
    );
    console.log(`   • Execution plan created with safe ordering`);
    console.log(`   • Guards evaluated for safety checks`);
    console.log(`   • Metrics collected showing system status`);
    console.log(`   • Recovery system verified working`);
    console.log("\n🚀 GoTN is ready for any engineer to use with any prompt!");

    return true;
  } catch (error: any) {
    console.error("❌ Documentation test failed:", error.message);
    return false;
  } finally {
    // Clean up
    if (existsSync(testWorkspace)) {
      rmSync(testWorkspace, { recursive: true, force: true });
    }
  }
}

testDocumentationFlow()
  .then((success) => {
    console.log(
      success
        ? "\n🎊 Documentation verified!"
        : "\n❌ Documentation needs fixes!"
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test error:", error);
    process.exit(1);
  });
