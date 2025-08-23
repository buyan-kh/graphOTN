# GoTN - Graph of Tiny Nodes

GoTN turns large user prompts into a graph of atomic micro-prompts, stores them with dependencies and semantic similarity, and enables safe execution planning with built-in guardrails.

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key (required for embeddings)
- Zilliz Cloud account (optional, falls back to memory)

### Environment Setup

Create `.env` in the project root:

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here
GOTN_EMBED_DIM=1536

# Optional (uses memory fallback if not set)
ZILLIZ_URI=https://your-cluster.api.gcp-us-west1.zillizcloud.com
ZILLIZ_TOKEN=your-zilliz-token
ZILLIZ_COLLECTION=gotn_nodes

# Optional
GOTN_PROJECT_ID=demo
```

### Install and Run

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the MCP server
cd packages/server
node dist/main.js
```

The server will show:

```
[GoTN] 🚀 GoTN MCP Server starting...
[GoTN] Registering 10 tools...
[GoTN] ✅ Server connected and ready
```

### Demo Flow

The MCP server runs over stdio and integrates with Cursor or other MCP clients. Here's the 5-minute demo:

**1. Connect via Cursor:**

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "gotn": {
      "command": "node",
      "args": ["/absolute/path/to/GoTN/packages/server/dist/main.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here",
        "ZILLIZ_URI": "your-zilliz-uri",
        "ZILLIZ_TOKEN": "your-zilliz-token"
      }
    }
  }
}
```

**2. Initialize workspace:**

```json
// Call via MCP client
{
  "tool": "gotn_index_workspace",
  "arguments": {
    "workspace_path": "./demo"
  }
}
```

**3. Break down any prompt:**

```json
// Use any prompt - this example creates a landing page
{
  "tool": "gotn_breakdown_prompt",
  "arguments": {
    "project_id": "demo",
    "prompt": "Build a dark landing page with header, hero section, and two call-to-action buttons",
    "workspace_path": "./demo",
    "compose": true
  }
}
```

**4. Execute first node:**

```json
// Replace NODE_ID with first ID from breakdown result
{
  "tool": "gotn_execute_node",
  "arguments": {
    "node_id": "NODE_ID",
    "workspace_path": "./demo"
  }
}
```

**5. Trace relationships:**

```json
{
  "tool": "gotn_trace_node",
  "arguments": {
    "node_id": "NODE_ID",
    "workspace_path": "./demo"
  }
}
```

**6. View debug info:**

```json
{
  "tool": "gotn_debug",
  "arguments": {
    "workspace_path": "./demo"
  }
}
```

**7. View in graph viewer:**
```bash
# Start the viewer
pnpm api    # Terminal 1
pnpm viewer # Terminal 2

# Open http://localhost:4312
# Click nodes to see details
# Use filter to search  
# Click reload after changes
```

## Vector Storage Modes

**With Zilliz (Production):**

- Vectors stored in Zilliz Cloud for fast semantic search
- Scalable to millions of nodes
- Persistent across sessions

**Memory Fallback (Development):**

- Vectors stored in memory when Zilliz env not set
- Perfect for local development and testing
- Automatically used if Zilliz connection fails

## Viewer

The monochrome React Flow viewer shows your graph:

- **Solid edges**: Hard dependencies (requires/produces)
- **Dashed edges**: Semantic similarity
- **Filter box**: Search nodes by text
- **Right panel**: Click any node to see raw JSON
- **Reload button**: Refresh after changes

### Running Viewer

```bash
# Terminal 1: API server (serves graph data)
pnpm api  # Runs on :4311

# Terminal 2: Viewer (React Flow interface) 
pnpm viewer  # Runs on :4312

# Open http://localhost:4312 in your browser
```

## Troubleshooting

**Missing OpenAI key:**

```
Error: OpenAI API key not found
```

→ Set `OPENAI_API_KEY` in `.env`

**Zilliz connection failed:**

```
Vector components not available, using fallback implementations
```

→ Check `ZILLIZ_URI` and `ZILLIZ_TOKEN`, or ignore (memory fallback works)

**Dimension mismatch:**

```
Collection dimension mismatch: expected 1536, got 384
```

→ Ensure `GOTN_EMBED_DIM=1536` matches your Zilliz collection

**Network timeout:**

```
Request timeout after 20s
```

→ Check internet connection and Zilliz service status

## Key Features

- **Atomic Decomposition**: Any prompt becomes tiny, executable steps
- **Smart Dependencies**: Automatic hard edges from requires/produces tags
- **Semantic Links**: Soft edges from mutual nearest neighbor similarity
- **Safe Execution**: Guards prevent execution when conditions aren't met
- **Audit Trail**: Complete journal of all operations
- **Recovery**: Rebuild graph from journal if corruption occurs
- **Local First**: All state in `.gotn` folder for trust and portability

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   MCP Server    │────│    Core      │────│   Vector    │
│  (10 tools)    │    │ (Graph+FS)   │    │ (Zilliz/Mem)│
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │
         └───────────────────────┼─────────────────────────┐
                                 │                         │
                    ┌─────────────────┐      ┌─────────────────┐
                    │   Viewer        │      │   .gotn/        │
                    │ (React Flow)    │      │ (Local State)   │
                    └─────────────────┘      └─────────────────┘
```

## Next Steps

- See `docs/schema.md` for data model details
- See `docs/mcp.md` for complete tool reference
- Try different prompts: web apps, CLIs, data pipelines, anything!
- Explore the graph in the viewer to understand decomposition
- Use `gotn_debug` to see metrics and storage status

## Contributing

GoTN is built for scale and safety. All state is local, all operations are journaled, and the system gracefully handles failures. Perfect for breaking down complex development tasks into manageable, auditable steps.
