/**
 * Metrics tracking for GoTN
 */
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
export declare class MetricsCollector {
    private workspacePath;
    private counters;
    constructor(workspacePath?: string);
    incrementSkips(): void;
    incrementGuardFails(): void;
    collectMetrics(): Promise<GoTNMetrics>;
    reset(): void;
}
export declare function getMetrics(workspacePath?: string): MetricsCollector;
