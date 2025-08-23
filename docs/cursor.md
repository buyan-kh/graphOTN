# GoTN Cursor Integration

This guide shows how to connect GoTN to Cursor as an MCP server for seamless prompt breakdown and execution planning.

## MCP Server Configuration

Add GoTN to your Cursor MCP settings. Open Cursor Settings → Features → Model Context Protocol and add:

```json
{
  "mcpServers": {
    "gotn": {
      "command": "node",
      "args": ["/absolute/path/to/GoTN/packages/server/dist/main.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key-here",
        "GOTN_EMBED_DIM": "1536",
        "ZILLIZ_URI": "https://your-cluster.api.gcp-us-west1.zillizcloud.com",
        "ZILLIZ_TOKEN": "your-zilliz-token-here",
        "ZILLIZ_COLLECTION": "gotn_nodes",
        "GOTN_PROJECT_ID": "cursor-project"
      }
    }
  }
}
```

**Important:** Use the absolute path to your GoTN installation. The server must be built first with `pnpm build`.

## Quick Start from Cursor

Once connected, you can use GoTN tools directly in Cursor:

### 1. Initialize Workspace

```json
{
  "tool": "gotn_index_workspace",
  "arguments": {
    "workspace_path": "/path/to/your/project"
  }
}
```

### 2. Break Down Any Prompt

**IoT Pipeline Example:**

```json
{
  "tool": "gotn_breakdown_prompt",
  "arguments": {
    "project_id": "iot-pipeline",
    "prompt": "Build an IoT data pipeline that collects sensor data via MQTT, processes it with Apache Kafka and Spark, stores results in Snowflake, and displays real-time dashboards",
    "workspace_path": "/path/to/your/project",
    "compose": true
  }
}
```

**Landing Page Example:**

```json
{
  "tool": "gotn_breakdown_prompt",
  "arguments": {
    "project_id": "landing-page",
    "prompt": "Create a dark-themed landing page with animated hero section, feature showcase, pricing cards, testimonials, and contact form using React and Tailwind CSS",
    "workspace_path": "/path/to/your/project",
    "compose": true
  }
}
```

### 3. Store Individual Nodes

```json
{
  "tool": "gotn_store_node",
  "arguments": {
    "node": {
      "id": "setup_mqtt_broker",
      "kind": "micro_prompt",
      "summary": "Configure MQTT broker for sensor data ingestion",
      "prompt_text": "Set up Mosquitto MQTT broker with authentication and SSL, configure topics for different sensor types",
      "children": [],
      "requires": ["docker_runtime"],
      "produces": ["mqtt_broker_ready"],
      "exec_target": "infrastructure/mqtt/docker-compose.yml",
      "tags": ["mqtt", "broker", "infrastructure"],
      "success_criteria": [
        "Broker accepts connections",
        "SSL certificates valid"
      ],
      "guards": ["Docker is running", "Ports 1883 and 8883 available"],
      "artifacts": {
        "files": [
          "infrastructure/mqtt/docker-compose.yml",
          "infrastructure/mqtt/mosquitto.conf"
        ],
        "outputs": ["mqtt_broker.log"],
        "dependencies": ["mosquitto"]
      },
      "status": "ready",
      "provenance": {
        "created_by": "cursor_user",
        "source": "manual_entry"
      },
      "version": 1
    },
    "workspace_path": "/path/to/your/project"
  }
}
```

### 4. Infer Edges Between Nodes

```json
{
  "tool": "gotn_infer_edges",
  "arguments": {
    "node_ids": ["setup_mqtt_broker", "configure_kafka", "setup_spark"],
    "workspace_path": "/path/to/your/project"
  }
}
```

### 5. Compose Execution Plan

```json
{
  "tool": "gotn_compose_plan",
  "arguments": {
    "goal": "Deploy IoT data pipeline",
    "requires": ["docker_runtime"],
    "produces": ["pipeline_deployed"],
    "workspace_path": "/path/to/your/project"
  }
}
```

### 6. Execute Nodes Safely

```json
{
  "tool": "gotn_execute_node",
  "arguments": {
    "node_id": "setup_mqtt_broker",
    "workspace_path": "/path/to/your/project"
  }
}
```

### 7. Trace Node Relationships

```json
{
  "tool": "gotn_trace_node",
  "arguments": {
    "node_id": "configure_kafka",
    "workspace_path": "/path/to/your/project"
  }
}
```

## Common Workflows

### Workflow 1: Quick Breakdown and Plan

```json
// 1. Break down your prompt (auto-composes plan)
{
  "tool": "gotn_breakdown_prompt",
  "arguments": {
    "project_id": "my-app",
    "prompt": "Your development task here...",
    "compose": true
  }
}

// 2. Execute first node
{
  "tool": "gotn_execute_node",
  "arguments": {
    "node_id": "first_node_id_from_breakdown"
  }
}
```

### Workflow 2: Manual Node Creation

```json
// 1. Initialize workspace
{"tool": "gotn_index_workspace", "arguments": {}}

// 2. Store custom nodes
{"tool": "gotn_store_node", "arguments": {"node": {...}}}

// 3. Create edges
{"tool": "gotn_infer_edges", "arguments": {"node_ids": [...]}}

// 4. Plan execution
{"tool": "gotn_compose_plan", "arguments": {"goal": "..."}}
```

## Troubleshooting

### Server Connection Issues

**Error:** `MCP server failed to start`

- **Fix:** Ensure absolute path to `dist/main.js` is correct
- **Hint:** Run `pnpm build` first to create dist files

**Error:** `OpenAI API key not found`

- **Fix:** Add `OPENAI_API_KEY` to env section
- **Hint:** Required for embedding generation

### Tool Execution Issues

**Error:** `Workspace not initialized`

- **Fix:** Call `gotn_index_workspace` first
- **Hint:** Creates `.gotn` folder structure

**Error:** `Zilliz connection failed`

- **Fix:** Check `ZILLIZ_URI` and `ZILLIZ_TOKEN`
- **Hint:** System falls back to memory storage automatically

**Error:** `Node validation failed`

- **Fix:** Check node schema matches examples above
- **Hint:** All required fields must be present

## Example Session

Here's a complete session breaking down a web app:

```bash
# In Cursor, run these tools in sequence:

# 1. Initialize
{"tool": "gotn_index_workspace"}

# 2. Break down prompt
{
  "tool": "gotn_breakdown_prompt",
  "arguments": {
    "project_id": "webapp",
    "prompt": "Build a React todo app with user authentication, real-time sync, and mobile responsive design",
    "compose": true
  }
}

# 3. Execute first node (will show "proceed" or "skip")
{
  "tool": "gotn_execute_node",
  "arguments": {
    "node_id": "setup_react_project"
  }
}

# 4. Trace relationships
{
  "tool": "gotn_trace_node",
  "arguments": {
    "node_id": "setup_authentication"
  }
}
```

## Tips for Best Results

1. **Be Specific**: Detailed prompts create better node breakdowns
2. **Use Auto-Compose**: Set `"compose": true` to get execution plans immediately
3. **Check Dependencies**: Use `gotn_trace_node` to understand relationships
4. **Start Small**: Test with simple prompts first
5. **Use the Viewer**: Run `pnpm api` and `pnpm viewer` to visualize your graphs

GoTN turns any development prompt into a structured, executable plan right from your editor!
