# GoTN MCP Tools Reference

This document provides complete input/output specifications for all GoTN MCP tools.

## gotn_index_workspace

Creates `.gotn` structure and indexes existing files for baseline context.

**Input:**

```json
{
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_index_workspace",
  "message": "Workspace initialized successfully with baseline indexing",
  "workspace_path": "/path/to/project",
  "structure_created": [".gotn/", ".gotn/meta.json", ".gotn/graph.json"],
  "indexed_files": ["package.json", "src/app.js", "src/utils.js"],
  "deps_nodes": 1,
  "code_nodes": 12,
  "timestamp": "2025-01-27T10:30:00Z"
}
```

## gotn_store_node

Validates and persists a node with embedding generation.

**Input:**

```json
{
  "node": {
    "id": "create_header",
    "kind": "micro_prompt",
    "summary": "Build responsive header component",
    "prompt_text": "Create a header with logo, navigation, and mobile menu",
    "children": [],
    "requires": [],
    "produces": ["header_component"],
    "exec_target": "components/Header.jsx",
    "tags": ["react", "component", "header"],
    "success_criteria": ["Header renders", "Mobile menu works"],
    "guards": ["React installed"],
    "artifacts": {
      "files": ["components/Header.jsx"],
      "outputs": [],
      "dependencies": []
    },
    "status": "ready",
    "provenance": { "created_by": "user", "source": "manual" },
    "version": 1
  },
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_store_node",
  "message": "Node stored with embedding",
  "node_id": "create_header",
  "embedding_ref": { "collection": "gotn_nodes", "id": "vec_def456" },
  "workspace_path": "/path/to/project",
  "timestamp": "2025-01-27T10:31:00Z"
}
```

## gotn_breakdown_prompt

Decomposes a large prompt into atomic micro-prompts with dependencies.

**Input:**

```json
{
  "project_id": "webapp",
  "prompt": "Build a todo app with React frontend and Node.js API",
  "mode": "tree",
  "max_nodes": 32,
  "compose": true,
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_breakdown_prompt",
  "message": "Successfully broke down prompt into 8 micro prompts and composed execution plan",
  "project_id": "webapp",
  "workspace_path": "/path/to/project",
  "created_node_ids": [
    "todo_app_root",
    "setup_react",
    "create_api",
    "add_database"
  ],
  "created_edge_count": 12,
  "root_id": "todo_app_root",
  "total_nodes": 8,
  "plan": {
    "ordered_node_ids": [
      "setup_react",
      "create_api",
      "add_database",
      "connect_frontend"
    ],
    "run_folder": "runs/run-20250127-103000",
    "layers": [
      ["setup_react"],
      ["create_api"],
      ["add_database"],
      ["connect_frontend"]
    ],
    "reason": "Topological sort on hard dependencies"
  },
  "timestamp": "2025-01-27T10:32:00Z"
}
```

## gotn_infer_edges

Creates hard and soft edges between nodes with evidence.

**Input:**

```json
{
  "node_ids": ["setup_react", "create_api", "add_database"],
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_infer_edges",
  "message": "Created 4 hard edges and 2 soft edges",
  "workspace_path": "/path/to/project",
  "hard_edges_created": 4,
  "soft_edges_created": 2,
  "edges": [
    {
      "src": "setup_react",
      "dst": "connect_frontend",
      "type": "hard_requires",
      "evidence": "connect_frontend requires 'react_ready' which setup_react produces"
    }
  ],
  "timestamp": "2025-01-27T10:33:00Z"
}
```

## gotn_compose_plan

Creates a safe execution order using topological sort on hard dependencies.

**Input:**

```json
{
  "goal": "Build todo application",
  "requires": ["node_runtime"],
  "produces": ["todo_app_complete"],
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_compose_plan",
  "message": "Plan created with 6 nodes in 3 layers",
  "workspace_path": "/path/to/project",
  "ordered_node_ids": [
    "setup_react",
    "create_api",
    "add_database",
    "connect_frontend",
    "add_styling",
    "deploy_app"
  ],
  "layers": [
    ["setup_react", "create_api"],
    ["add_database"],
    ["connect_frontend", "add_styling", "deploy_app"]
  ],
  "reason": "Topological sort on hard dependencies, soft grouping within layers",
  "run_folder": "runs/run-20250127-103400",
  "has_cycles": false,
  "timestamp": "2025-01-27T10:34:00Z"
}
```

## gotn_execute_node

Evaluates guards and creates patch stubs for safe execution.

**Input:**

```json
{
  "node_id": "setup_react",
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_execute_node",
  "message": "Node executed successfully",
  "node_id": "setup_react",
  "workspace_path": "/path/to/project",
  "action": "proceed",
  "reason": "All guards passed, no artifacts exist",
  "patch_path": "runs/run-20250127-103400/patches/setup_react.patch",
  "node_status": "completed",
  "timestamp": "2025-01-27T10:35:00Z"
}
```

## gotn_trace_node

Returns complete relationship information and edge proofs for a node.

**Input:**

```json
{
  "node_id": "create_api",
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_trace_node",
  "message": "Traced node create_api with 3 edge proofs",
  "node_id": "create_api",
  "workspace_path": "/path/to/project",
  "parents": ["todo_app_root"],
  "children": ["add_routes", "add_middleware"],
  "requires": ["node_runtime"],
  "produces": ["api_server_ready"],
  "incoming_edges": [
    {
      "src": "setup_react",
      "type": "soft_semantic",
      "evidence": "Mutual semantic similarity",
      "score": 0.8234
    }
  ],
  "outgoing_edges": [
    {
      "dst": "add_database",
      "type": "hard_requires",
      "evidence": "Tag match: api_server_ready"
    }
  ],
  "proof_set": [
    {
      "type": "hard_dependency",
      "direction": "outgoing",
      "from": "create_api",
      "to": "add_database",
      "evidence": "add_database requires 'api_server_ready' which create_api produces",
      "reason": "Hard dependency: tag match api_server_ready"
    },
    {
      "type": "semantic_similarity",
      "direction": "incoming",
      "from": "setup_react",
      "to": "create_api",
      "score": 0.8234,
      "evidence": "Mutual semantic similarity: 0.8234",
      "reason": "Semantic similarity: 0.8234 - mutual nearest neighbors"
    }
  ],
  "timestamp": "2025-01-27T10:36:00Z"
}
```

## gotn_search_nodes

Searches nodes using semantic similarity on embeddings.

**Input:**

```json
{
  "query": "database setup and configuration",
  "limit": 5,
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_search_nodes",
  "message": "Found 3 matching nodes",
  "query": "database setup and configuration",
  "workspace_path": "/path/to/project",
  "results": [
    {
      "node_id": "add_database",
      "summary": "Set up PostgreSQL database with schema",
      "score": 0.9123,
      "tags": ["database", "postgresql", "schema"]
    },
    {
      "node_id": "configure_db_connection",
      "summary": "Configure database connection pool",
      "score": 0.8567,
      "tags": ["database", "connection", "pool"]
    }
  ],
  "total_results": 3,
  "timestamp": "2025-01-27T10:37:00Z"
}
```

## gotn_debug

Returns current system metrics and storage status.

**Input:**

```json
{
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_debug",
  "message": "Debug info: 12 nodes, 18 edges",
  "workspace_path": "/path/to/project",
  "metrics": {
    "nodes": 12,
    "edges": 18,
    "runs": 2,
    "skips": 3,
    "guard_fails": 1,
    "storage_mode": "filesystem",
    "vector_mode": "zilliz",
    "workspace_path": "/path/to/project",
    "last_updated": "2025-01-27T10:38:00Z"
  },
  "timestamp": "2025-01-27T10:38:00Z"
}
```

## gotn_recover

Rebuilds graph from journal and verifies integrity.

**Input:**

```json
{
  "workspace_path": "/path/to/project"
}
```

**Output:**

```json
{
  "ok": true,
  "tool": "gotn_recover",
  "message": "Recovery completed: 12 nodes, 18 edges recovered. 1 corrupt entries skipped",
  "workspace_path": "/path/to/project",
  "nodes_recovered": 12,
  "edges_recovered": 18,
  "skipped_entries": 1,
  "corrupt_entries": [
    "add_node: Invalid input: expected string, received number"
  ],
  "integrity_check": {
    "nodes": 12,
    "edges": 18,
    "valid": true
  },
  "timestamp": "2025-01-27T10:39:00Z"
}
```

## End-to-End Example

Complete workflow from prompt to execution:

```bash
# 1. Initialize workspace
{"method": "call_tool", "params": {"name": "gotn_index_workspace", "arguments": {"workspace_path": "./demo"}}}

# 2. Break down prompt with auto-compose
{"method": "call_tool", "params": {"name": "gotn_breakdown_prompt", "arguments": {"project_id": "demo", "prompt": "Build a chat application with real-time messaging", "workspace_path": "./demo"}}}

# 3. Execute first node
{"method": "call_tool", "params": {"name": "gotn_execute_node", "arguments": {"node_id": "setup_websocket_server", "workspace_path": "./demo"}}}

# 4. Trace relationships
{"method": "call_tool", "params": {"name": "gotn_trace_node", "arguments": {"node_id": "setup_websocket_server", "workspace_path": "./demo"}}}

# 5. Check system status
{"method": "call_tool", "params": {"name": "gotn_debug", "arguments": {"workspace_path": "./demo"}}}
```

This workflow demonstrates the complete GoTN cycle: decomposition, planning, execution, and inspection. Each tool builds on the previous one to create a complete audit trail of development decisions and progress.
