/**
 * Metrics tracking for GoTN
 */

import { readGraph } from "./fsStore.js";
import { readFileSync, existsSync } from "fs";
import path from "path";

export interface GoTNMetrics {
  nodes: number;
  edges: number;
  runs: number;
  skips: number;
  guard_fails: number;
  storage_mode: "filesystem" | "memory";
  vector_mode: "zilliz" | "memory" | "none";
  workspace_path: string;
  last_updated: string;
}

export class MetricsCollector {
  private workspacePath: string;
  private counters: {
    skips: number;
    guard_fails: number;
  } = {
    skips: 0,
    guard_fails: 0,
  };

  constructor(workspacePath: string = ".") {
    this.workspacePath = workspacePath;
  }

  incrementSkips(): void {
    this.counters.skips++;
  }

  incrementGuardFails(): void {
    this.counters.guard_fails++;
  }

  async collectMetrics(): Promise<GoTNMetrics> {
    try {
      // Count nodes and edges from graph
      const graph = await readGraph(this.workspacePath);

      // Count runs from runs directory
      let runCount = 0;
      const runsPath = path.join(this.workspacePath, ".gotn", "runs");
      if (existsSync(runsPath)) {
        try {
          const { readdirSync } = await import("fs");
          const runFolders = readdirSync(runsPath).filter((f) =>
            f.startsWith("run-")
          );
          runCount = runFolders.length;
        } catch {
          runCount = 0;
        }
      }

      // Determine storage and vector modes
      const storageMode = existsSync(path.join(this.workspacePath, ".gotn"))
        ? "filesystem"
        : "memory";

      let vectorMode: "zilliz" | "memory" | "none" = "none";
      if (process.env.ZILLIZ_URI && process.env.ZILLIZ_TOKEN) {
        vectorMode = "zilliz";
      } else if (process.env.OPENAI_API_KEY) {
        vectorMode = "memory";
      }

      return {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        runs: runCount,
        skips: this.counters.skips,
        guard_fails: this.counters.guard_fails,
        storage_mode: storageMode,
        vector_mode: vectorMode,
        workspace_path: this.workspacePath,
        last_updated: new Date().toISOString(),
      };
    } catch (error: any) {
      // Return empty metrics on error
      return {
        nodes: 0,
        edges: 0,
        runs: 0,
        skips: this.counters.skips,
        guard_fails: this.counters.guard_fails,
        storage_mode: "memory",
        vector_mode: "none",
        workspace_path: this.workspacePath,
        last_updated: new Date().toISOString(),
      };
    }
  }

  reset(): void {
    this.counters.skips = 0;
    this.counters.guard_fails = 0;
  }
}

// Global metrics collector
let globalMetrics: MetricsCollector | null = null;

export function getMetrics(workspacePath?: string): MetricsCollector {
  if (!globalMetrics || workspacePath) {
    globalMetrics = new MetricsCollector(workspacePath || ".");
  }
  return globalMetrics;
}
