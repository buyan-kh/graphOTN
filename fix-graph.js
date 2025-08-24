#!/usr/bin/env node

import { getCloudStore } from "./packages/core/dist/cloudStore.js";

console.log("🔧 FIXING GRAPH WITH CORRECT EDGE DIRECTIONS...");

const store = getCloudStore();
const projectId = "working-demo";

// Create nodes in proper hierarchy
const nodes = [
  {
    id: "main",
    kind: "task",
    summary: "Build React Dashboard",
    prompt_text: "Create a complete React dashboard application",
    children: ["frontend", "backend", "deploy"],
    requires: [],
    produces: ["app_complete"],
    exec_target: ".",
    tags: ["root"],
    success_criteria: ["Dashboard complete"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "frontend",
    kind: "task",
    summary: "Create UI Components",
    prompt_text: "Build React components for the dashboard",
    parent: "main",
    children: [],
    requires: [],
    produces: ["ui_ready"],
    exec_target: "frontend/",
    tags: ["frontend"],
    success_criteria: ["Components working"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "backend",
    kind: "task",
    summary: "Setup API Server",
    prompt_text: "Create Express API with database",
    parent: "main",
    children: [],
    requires: [],
    produces: ["api_ready"],
    exec_target: "backend/",
    tags: ["backend"],
    success_criteria: ["API endpoints working"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "deploy",
    kind: "task",
    summary: "Deploy Application",
    prompt_text: "Deploy to production environment",
    parent: "main",
    children: [],
    requires: ["ui_ready", "api_ready"],
    produces: ["deployed"],
    exec_target: ".",
    tags: ["deployment"],
    success_criteria: ["App live in production"],
    guards: [],
    artifacts: { files: [], outputs: [], dependencies: [] },
    status: "ready",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create edges with CORRECT direction (parent -> child)
const edges = [
  {
    src: "main",
    dst: "frontend",
    type: "derived_from",
    evidence: "Frontend is part of main task",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "main",
    dst: "backend",
    type: "derived_from",
    evidence: "Backend is part of main task",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "main",
    dst: "deploy",
    type: "derived_from",
    evidence: "Deployment is part of main task",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "frontend",
    dst: "deploy",
    type: "soft_semantic",
    score: 0.8,
    evidence: "Deploy depends on frontend",
    provenance: { created_by: "demo", source: "manual" },
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    src: "backend",
    dst: "deploy",
    type: "soft_semantic",
    score: 0.8,
    evidence: "Deploy depends on backend",
    provenance: { created_by: "demo", source: "manual" },
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

  console.log("✅ DONE! Refresh viewer and select 'Working Demo' project");
  console.log("🌐 http://localhost:4312");
  console.log("");
  console.log("📊 You should see:");
  console.log("   - Main task at the top");
  console.log("   - Frontend and Backend in the middle");
  console.log("   - Deploy at the bottom");
  console.log("   - Solid lines showing hierarchy");
  console.log("   - Dashed lines showing dependencies");
}

createGraph();
