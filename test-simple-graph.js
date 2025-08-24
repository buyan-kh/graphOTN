#!/usr/bin/env node

import { getCloudStore } from "./packages/core/dist/cloudStore.js";

console.log("🔥 CREATING SIMPLE WORKING GRAPH...");

const store = getCloudStore();
const projectId = "simple-test";

// Clear and create simple nodes
const nodes = [
  {
    id: "step1",
    kind: "task",
    summary: "Setup project",
    prompt_text: "Initialize the project structure",
    children: [],
    requires: [],
    produces: ["project_ready"],
    exec_target: ".",
    tags: ["setup"],
    success_criteria: ["Project initialized"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "step2",
    kind: "task",
    summary: "Build frontend",
    prompt_text: "Create the user interface",
    children: [],
    requires: ["project_ready"],
    produces: ["frontend_done"],
    exec_target: "frontend/",
    tags: ["frontend"],
    success_criteria: ["UI working"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "step3",
    kind: "task",
    summary: "Build backend",
    prompt_text: "Create the API server",
    children: [],
    requires: ["project_ready"],
    produces: ["backend_done"],
    exec_target: "backend/",
    tags: ["backend"],
    success_criteria: ["API working"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "step4",
    kind: "task",
    summary: "Connect and deploy",
    prompt_text: "Connect frontend to backend and deploy",
    children: [],
    requires: ["frontend_done", "backend_done"],
    produces: ["app_deployed"],
    exec_target: ".",
    tags: ["deployment"],
    success_criteria: ["App live"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create simple edges (NO CYCLES!)
const edges = [
  {
    src: "step1",
    dst: "step2",
    type: "hard_requires",
    evidence: "Frontend needs project setup",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "step1",
    dst: "step3",
    type: "hard_requires",
    evidence: "Backend needs project setup",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "step2",
    dst: "step4",
    type: "hard_requires",
    evidence: "Deployment needs frontend",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "step3",
    dst: "step4",
    type: "hard_requires",
    evidence: "Deployment needs backend",
    provenance: { created_by: "test", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Store everything
async function createGraph() {
  console.log("📝 Storing nodes...");
  for (const node of nodes) {
    await store.storeNode(node, projectId);
  }

  console.log("🔗 Storing edges...");
  for (const edge of edges) {
    await store.storeEdge(edge, projectId);
  }

  console.log('✅ DONE! Check viewer for "Simple Test" project');
  console.log("🌐 http://localhost:4312");
}

createGraph();
