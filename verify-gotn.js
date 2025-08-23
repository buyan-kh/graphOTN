#!/usr/bin/env node

/**
 * GoTN v1.0 Verification Script
 * Verifies all components are ready for production
 */

import { existsSync, readFileSync } from "fs";
import { spawn } from "child_process";

console.log("🎯 GoTN v1.0 Verification\n");

let checks = 0;
let passed = 0;

const check = (name, condition, hint = "") => {
  checks++;
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${hint ? ` - ${hint}` : ""}`);
  }
};

// 1. Project Structure
console.log("📁 Project Structure:");
check(
  "Core packages",
  existsSync("packages/core") &&
    existsSync("packages/server") &&
    existsSync("packages/vec")
);
check(
  "API server",
  existsSync("api/server.js") && existsSync("api/package.json")
);
check(
  "React viewer",
  existsSync("viewer/src/App.tsx") && existsSync("viewer/package.json")
);
check(
  "Documentation",
  existsSync("docs/schema.md") &&
    existsSync("docs/mcp.md") &&
    existsSync("docs/cursor.md")
);

// 2. Build Status
console.log("\n🔧 Build Status:");
check(
  "Server dist",
  existsSync("packages/server/dist/main.js"),
  "Run 'pnpm build'"
);
check(
  "Core dist",
  existsSync("packages/core/dist/index.js"),
  "Run 'pnpm build'"
);
check("Vec dist", existsSync("packages/vec/dist/index.js"), "Run 'pnpm build'");

// 3. Dependencies
console.log("\n📦 Dependencies:");
try {
  const rootPkg = JSON.parse(readFileSync("package.json", "utf8"));
  const serverPkg = JSON.parse(
    readFileSync("packages/server/package.json", "utf8")
  );
  const apiPkg = JSON.parse(readFileSync("api/package.json", "utf8"));
  const viewerPkg = JSON.parse(readFileSync("viewer/package.json", "utf8"));

  check(
    "Root workspace",
    rootPkg.workspaces && rootPkg.workspaces.includes("packages/*")
  );
  check("MCP server deps", serverPkg.dependencies["@modelcontextprotocol/sdk"]);
  check(
    "API server deps",
    apiPkg.dependencies["express"] && apiPkg.dependencies["cors"]
  );
  check(
    "Viewer deps",
    viewerPkg.dependencies["react"] && viewerPkg.dependencies["reactflow"]
  );
} catch (error) {
  check("Package.json parsing", false, "JSON syntax error");
}

// 4. Configuration
console.log("\n⚙️ Configuration:");
check(
  "Environment template",
  existsSync(".env") || existsSync(".env.example"),
  "Create .env with API keys"
);
check("Viewer proxy config", existsSync("viewer/vite.config.ts"));
check("TypeScript configs", existsSync("tsconfig.json"));

// 5. Documentation Quality
console.log("\n📚 Documentation:");
try {
  const readme = readFileSync("README.md", "utf8");
  const schema = readFileSync("docs/schema.md", "utf8");
  const mcp = readFileSync("docs/mcp.md", "utf8");
  const cursor = readFileSync("docs/cursor.md", "utf8");

  check(
    "README completeness",
    readme.includes("Quick Start") && readme.includes("Troubleshooting")
  );
  check(
    "Schema documentation",
    schema.includes("Node") && schema.includes("Edge")
  );
  check(
    "MCP tool reference",
    mcp.includes("gotn_breakdown_prompt") && mcp.includes("gotn_execute_node")
  );
  check(
    "Cursor integration",
    cursor.includes("mcpServers") && cursor.includes("IoT Pipeline Example")
  );
} catch (error) {
  check("Documentation files", false, "Missing or corrupted docs");
}

// 6. MCP Server Registration
console.log("\n🔌 MCP Server:");
try {
  const serverCode = readFileSync("packages/server/src/main.ts", "utf8");
  const toolCount = (serverCode.match(/name: "gotn_/g) || []).length;
  check("10 tools registered", toolCount === 10, `Found ${toolCount} tools`);
  check(
    "Tool handlers",
    serverCode.includes("handleBreakdownPrompt") &&
      serverCode.includes("handleExecuteNode")
  );
} catch (error) {
  check("Server code", false, "Cannot read server source");
}

// 7. Core Engine Status
console.log("\n🧠 Core Engines:");
check("Breakdown engine", existsSync("packages/core/src/breakdownEngine.ts"));
check("Edge engine", existsSync("packages/core/src/edgeEngine.ts"));
check("Plan composer", existsSync("packages/core/src/planComposer.ts"));
check("Guard engine", existsSync("packages/core/src/guardEngine.ts"));
check("Recovery engine", existsSync("packages/core/src/recovery.ts"));

// 8. Vector Storage
console.log("\n🔍 Vector Storage:");
check("Embeddings interface", existsSync("packages/vec/src/embeddings.ts"));
check("Vector store interface", existsSync("packages/vec/src/vectorStore.ts"));
check("Zilliz integration", existsSync("packages/vec/src/zilliz.ts"));
check("Memory fallback", existsSync("packages/vec/src/vectorStore.ts")); // MemoryVectorStore is in vectorStore.ts

// 9. Viewer Components
console.log("\n🎨 Viewer Components:");
check("React Flow integration", existsSync("viewer/src/App.tsx"));
check("Node drawer", existsSync("viewer/src/NodeDrawer.tsx"));
check("Graph utilities", existsSync("viewer/src/utils.ts"));
check("Type definitions", existsSync("viewer/src/types.ts"));
check("Monochrome styles", existsSync("viewer/src/App.css"));

// Final Report
console.log("\n📊 VERIFICATION RESULTS\n");
const successRate = ((passed / checks) * 100).toFixed(1);
console.log(`✅ Passed: ${passed}/${checks} checks (${successRate}%)`);

if (passed === checks) {
  console.log("\n🎉 GoTN v1.0 VERIFICATION COMPLETE!");
  console.log("\n🚀 Ready to ship:");
  console.log("  • MCP server with 10 tools");
  console.log("  • Complete prompt breakdown system");
  console.log("  • Safe execution planning with guards");
  console.log("  • Monochrome React Flow viewer");
  console.log("  • Zilliz + memory fallback storage");
  console.log("  • Comprehensive documentation");
  console.log("  • Cursor integration ready");

  console.log("\n📋 Quick Start:");
  console.log("  1. Set environment variables in .env");
  console.log("  2. Run 'pnpm build' to compile");
  console.log("  3. Add to Cursor MCP config (see docs/cursor.md)");
  console.log("  4. Start viewer: 'pnpm api' + 'pnpm viewer'");
  console.log("  5. Break down any prompt and visualize!");
} else {
  console.log(`\n❌ ${checks - passed} issues need attention before shipping`);
  console.log("\nRun 'pnpm build' and check missing files/dependencies");
}

console.log(`\n🎯 GoTN: Turn any big prompt into atomic, executable steps!`);
process.exit(passed === checks ? 0 : 1);
