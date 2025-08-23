/**
 * BreakdownEngine - Automatic prompt decomposition into micro prompts
 *
 * Converts large user prompts into a progressive tree of atomic micro prompts
 * with proper dependencies, validation, and linking.
 */
export interface BreakdownRequest {
    project_id: string;
    prompt: string;
    mode: "tree" | "flat";
    max_nodes: number;
}
export interface BreakdownResult {
    created_node_ids: string[];
    created_edge_count: number;
    root_id: string;
    total_nodes: number;
}
export interface LLMBreakdownNode {
    id: string;
    summary: string;
    prompt_text: string;
    parent?: string;
    children: string[];
    requires: string[];
    produces: string[];
    exec_target: string;
    success_criteria: string[];
    guards: string[];
    tags: string[];
}
export interface LLMBreakdownResponse {
    root_id: string;
    nodes: LLMBreakdownNode[];
}
export declare class BreakdownEngine {
    private initialized;
    constructor();
    private ensureInitialized;
    /**
     * Generate breakdown using LLM (mock implementation for now)
     */
    private generateBreakdown;
    /**
     * IoT Pipeline fixture for testing
     */
    private getIoTPipelineFixture;
    /**
     * Landing Page fixture for testing
     */
    private getLandingPageFixture;
    /**
     * Generic breakdown for other prompts
     */
    private getGenericBreakdown;
    /**
     * Convert LLM breakdown nodes to GoTN Node format
     */
    private convertToGoTNNodes;
    /**
     * Create parent-child edges for the breakdown tree
     */
    private createParentChildEdges;
    /**
     * Main breakdown function
     */
    breakdown(request: BreakdownRequest): Promise<BreakdownResult>;
}
export declare function getBreakdownEngine(): BreakdownEngine;
