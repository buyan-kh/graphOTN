import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const app = express();
const PORT = 4311;

app.use(cors());
app.use(express.json());

// Stub data for when no .gotn exists
const stubGraph = {
  nodes: [
    {
      id: "web_app_root",
      kind: "micro_prompt",
      summary: "Build web application foundation",
      prompt_text: "Set up the basic structure for a web application",
      children: ["setup_frontend", "setup_backend"],
      requires: [],
      produces: ["project_initialized"],
      exec_target: ".",
      tags: ["root", "setup"],
      success_criteria: ["Project structure created"],
      guards: [],
      artifacts: { files: [], outputs: [], dependencies: [] },
      status: "ready",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:00:00Z",
      updated_at: "2025-01-27T10:00:00Z"
    },
    {
      id: "setup_frontend",
      kind: "micro_prompt", 
      summary: "Initialize React frontend",
      prompt_text: "Create React app with TypeScript and basic routing",
      children: [],
      requires: ["project_initialized"],
      produces: ["frontend_ready"],
      exec_target: "frontend/",
      tags: ["react", "frontend"],
      success_criteria: ["React app runs"],
      guards: ["Node.js available"],
      artifacts: { files: ["frontend/package.json"], outputs: [], dependencies: [] },
      status: "ready",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:01:00Z",
      updated_at: "2025-01-27T10:01:00Z"
    },
    {
      id: "setup_backend",
      kind: "micro_prompt",
      summary: "Initialize Express backend", 
      prompt_text: "Create Express server with basic middleware",
      children: [],
      requires: ["project_initialized"],
      produces: ["backend_ready"],
      exec_target: "backend/",
      tags: ["express", "backend"],
      success_criteria: ["Server starts on port 3000"],
      guards: ["Node.js available"],
      artifacts: { files: ["backend/server.js"], outputs: [], dependencies: [] },
      status: "ready",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:02:00Z",
      updated_at: "2025-01-27T10:02:00Z"
    },
    {
      id: "connect_services",
      kind: "micro_prompt",
      summary: "Connect frontend to backend",
      prompt_text: "Set up API calls and data flow between frontend and backend",
      children: [],
      requires: ["frontend_ready", "backend_ready"],
      produces: ["services_connected"],
      exec_target: "frontend/src/api/",
      tags: ["integration", "api"],
      success_criteria: ["API calls work"],
      guards: ["Both services running"],
      artifacts: { files: ["frontend/src/api/client.js"], outputs: [], dependencies: [] },
      status: "ready",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:03:00Z",
      updated_at: "2025-01-27T10:03:00Z"
    },
    {
      id: "deploy_app",
      kind: "micro_prompt",
      summary: "Deploy application to production",
      prompt_text: "Set up deployment pipeline and production environment",
      children: [],
      requires: ["services_connected"],
      produces: ["app_deployed"],
      exec_target: "deploy/",
      tags: ["deployment", "production"],
      success_criteria: ["App accessible via URL"],
      guards: ["All tests pass"],
      artifacts: { files: ["deploy/config.yml"], outputs: [], dependencies: [] },
      status: "ready",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:04:00Z",
      updated_at: "2025-01-27T10:04:00Z"
    }
  ],
  edges: [
    {
      src: "web_app_root",
      dst: "setup_frontend",
      type: "derived_from",
      score: null,
      evidence: "Parent-child decomposition relationship",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:01:00Z"
    },
    {
      src: "web_app_root", 
      dst: "setup_backend",
      type: "derived_from",
      score: null,
      evidence: "Parent-child decomposition relationship",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:02:00Z"
    },
    {
      src: "setup_frontend",
      dst: "connect_services",
      type: "hard_requires",
      score: null,
      evidence: "connect_services requires 'frontend_ready' which setup_frontend produces",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:03:00Z"
    },
    {
      src: "setup_backend",
      dst: "connect_services", 
      type: "hard_requires",
      score: null,
      evidence: "connect_services requires 'backend_ready' which setup_backend produces",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:03:00Z"
    },
    {
      src: "connect_services",
      dst: "deploy_app",
      type: "hard_requires",
      score: null,
      evidence: "deploy_app requires 'services_connected' which connect_services produces",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:04:00Z"
    },
    {
      src: "setup_frontend",
      dst: "setup_backend",
      type: "soft_semantic",
      score: 0.7234,
      evidence: "Semantic similarity: both are setup tasks",
      provenance: { created_by: "stub", source: "demo" },
      version: 1,
      created_at: "2025-01-27T10:05:00Z"
    }
  ],
  version: 1
};

// GET /graph endpoint
app.get('/graph', (req, res) => {
  try {
    // Try to read real graph from .gotn
    const graphPath = path.join(process.cwd(), '.gotn', 'graph.json');
    
    if (existsSync(graphPath)) {
      const graphData = readFileSync(graphPath, 'utf8');
      const graph = JSON.parse(graphData);
      
      console.log(`📊 Serving real graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
      res.json(graph);
    } else {
      console.log('📋 No .gotn found, serving stub graph');
      res.json(stubGraph);
    }
  } catch (error) {
    console.error('❌ Error reading graph:', error.message);
    console.log('📋 Falling back to stub graph');
    res.json(stubGraph);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 GoTN API server running on http://localhost:${PORT}`);
  console.log(`📊 Graph endpoint: http://localhost:${PORT}/graph`);
});
