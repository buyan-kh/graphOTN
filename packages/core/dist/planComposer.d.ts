/**
 * PlanComposer - Creates safe execution plans from dependency graphs
 */
export interface PlanRequest {
    goal?: string;
    requires?: string[];
    produces?: string[];
}
export interface PlanResult {
    ordered_node_ids: string[];
    reason: string;
    run_folder: string;
    layers: string[][];
}
export declare class PlanComposer {
    constructor();
    /**
     * Topological sort with cycle detection
     */
    private topologicalSort;
    /**
     * Filter nodes based on goal criteria
     */
    private filterNodes;
    /**
     * Create execution plan
     */
    composePlan(request: PlanRequest): Promise<PlanResult>;
}
export declare function getPlanComposer(): PlanComposer;
