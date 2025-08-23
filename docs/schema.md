# GoTN Schema Reference

This document describes the core data structures used in GoTN.

## Node

A node represents an atomic micro-prompt with all necessary metadata for execution and linking.

```json
{
  "id": "setup_web_server",
  "kind": "micro_prompt",
  "summary": "Configure Express server with CORS and middleware",
  "prompt_text": "Set up Express.js server with CORS, body parsing, and error handling middleware",
  "parent": "web_app_root",
  "children": ["setup_routes", "setup_database"],
  "requires": ["node_runtime"],
  "produces": ["web_server_ready"],
  "exec_target": "server/app.js",
  "embedding_ref": {
    "collection": "gotn_nodes",
    "id": "vec_abc123"
  },
  "tags": ["express", "server", "middleware"],
  "success_criteria": ["Server starts on port 3000", "Health check responds"],
  "guards": ["package.json exists", "node_modules installed"],
  "artifacts": {
    "files": ["server/app.js"],
    "outputs": ["server.log"],
    "dependencies": ["express", "cors"]
  },
  "status": "ready",
  "provenance": {
    "created_by": "breakdown_engine",
    "source": "user_prompt"
  },
  "version": 1,
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": "2025-01-27T10:30:00Z"
}
```

### Node Fields

- **id**: Unique identifier
- **kind**: Type of node (`micro_prompt`, `code_symbol`, etc.)
- **summary**: One-line description
- **prompt_text**: Detailed instructions for execution
- **parent/children**: Tree structure from decomposition
- **requires/produces**: Dependency tags for planning
- **exec_target**: File or resource this node operates on
- **embedding_ref**: Reference to vector in Zilliz (not the vector itself)
- **tags**: Keywords for filtering and search
- **success_criteria**: How to verify completion
- **guards**: Pre-conditions that must be met
- **artifacts**: Files, outputs, and dependencies this node creates/needs
- **status**: Current state (`ready`, `completed`, `skipped`, `failed`)
- **provenance**: Creation metadata
- **version**: Schema version

## Edge

Edges represent relationships between nodes with evidence and scoring.

```json
{
  "src": "setup_web_server",
  "dst": "setup_database",
  "type": "hard_requires",
  "score": null,
  "evidence": "setup_database requires 'web_server_ready' which setup_web_server produces",
  "provenance": {
    "created_by": "edge_engine",
    "source": "requires_produces_match"
  },
  "version": 1,
  "created_at": "2025-01-27T10:31:00Z"
}
```

### Edge Types

**hard_requires**: Explicit dependencies from requires/produces matching

- Used for topological sorting
- Must be satisfied for safe execution
- Evidence shows the tag match

**soft_semantic**: Semantic similarity relationships

- Based on embedding cosine similarity
- Used for grouping and context
- Evidence includes similarity score

**derived_from**: Parent-child relationships from decomposition

- Shows the breakdown tree structure
- Used for tracing and navigation

### Edge Fields

- **src/dst**: Source and destination node IDs
- **type**: Relationship type (see above)
- **score**: Numeric strength (for soft edges only)
- **evidence**: Human-readable explanation
- **provenance**: How this edge was created

## Run

A run represents an execution session with ordered steps and outcomes.

```json
{
  "id": "run-20250127-103000",
  "goal": "Build web application",
  "ordered_node_ids": [
    "setup_web_server",
    "setup_database",
    "create_routes",
    "add_frontend"
  ],
  "layers": [
    ["setup_web_server"],
    ["setup_database"],
    ["create_routes", "add_frontend"]
  ],
  "ordering_reason": "Topological sort on hard dependencies, soft grouping within layers",
  "created_at": "2025-01-27T10:30:00Z",
  "workspace_path": "/path/to/project"
}
```

### Run Fields

- **id**: Timestamped unique identifier
- **goal**: High-level objective
- **ordered_node_ids**: Safe execution order
- **layers**: Groups of nodes that can run in parallel
- **ordering_reason**: Explanation of the ordering logic
- **created_at**: When the plan was created
- **workspace_path**: Where this run applies

## Journal Entry

Journal entries provide a complete audit trail of all operations.

```json
{
  "event": "add_node",
  "timestamp": "2025-01-27T10:30:00Z",
  "data": {
    "node": {
      "id": "setup_web_server",
      "kind": "micro_prompt",
      "summary": "Configure Express server"
    }
  }
}
```

### Journal Event Types

- **workspace_initialized**: New workspace created
- **add_node**: Node stored
- **update_node**: Node modified
- **add_edge**: Edge created
- **start_run**: Execution plan created
- **execute_step**: Individual node executed

## Vector Storage

GoTN separates vector storage from node metadata:

**In Node (metadata only):**

```json
{
  "embedding_ref": {
    "collection": "gotn_nodes",
    "id": "vec_abc123"
  }
}
```

**In Zilliz (vectors only):**

```json
{
  "id": "vec_abc123",
  "project_id": "demo",
  "embedding": [0.1, -0.3, 0.7, ...]
}
```

This design keeps nodes lightweight while enabling fast semantic search through Zilliz's optimized vector operations.

## Schema Evolution

All schemas include a `version` field for backward compatibility. GoTN validates all data with Zod schemas and gracefully handles version differences during recovery operations.

The journal provides complete state reconstruction, so even if schema changes occur, historical data remains accessible through the recovery system.
