/**
 * Metrics tracking for GoTN
 */
import { readGraph } from "./fsStore.js";
import { existsSync } from "fs";
import path from "path";
export class MetricsCollector {
    workspacePath;
    counters = {
        skips: 0,
        guard_fails: 0,
    };
    constructor(workspacePath = ".") {
        this.workspacePath = workspacePath;
    }
    incrementSkips() {
        this.counters.skips++;
    }
    incrementGuardFails() {
        this.counters.guard_fails++;
    }
    async collectMetrics() {
        try {
            // Count nodes and edges from graph
            const graph = await readGraph(this.workspacePath);
            // Count runs from runs directory
            let runCount = 0;
            const runsPath = path.join(this.workspacePath, ".gotn", "runs");
            if (existsSync(runsPath)) {
                try {
                    const { readdirSync } = await import("fs");
                    const runFolders = readdirSync(runsPath).filter((f) => f.startsWith("run-"));
                    runCount = runFolders.length;
                }
                catch {
                    runCount = 0;
                }
            }
            // Determine storage and vector modes
            const storageMode = existsSync(path.join(this.workspacePath, ".gotn"))
                ? "filesystem"
                : "memory";
            let vectorMode = "none";
            if (process.env.ZILLIZ_URI && process.env.ZILLIZ_TOKEN) {
                vectorMode = "zilliz";
            }
            else if (process.env.OPENAI_API_KEY) {
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
        }
        catch (error) {
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
    reset() {
        this.counters.skips = 0;
        this.counters.guard_fails = 0;
    }
}
// Global metrics collector
let globalMetrics = null;
export function getMetrics(workspacePath) {
    if (!globalMetrics || workspacePath) {
        globalMetrics = new MetricsCollector(workspacePath || ".");
    }
    return globalMetrics;
}
