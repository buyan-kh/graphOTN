/**
 * Cloud Breakdown Engine - Real OpenAI-powered atomic decomposition
 * No filesystem dependencies, pure cloud storage
 */
import { Node, Edge } from "./schemas.js";
export interface CloudBreakdownRequest {
    project_id: string;
    prompt: string;
    mode?: "tree" | "flat";
    max_nodes?: number;
}
export interface CloudBreakdownResult {
    nodes: Node[];
    edges: Edge[];
    root_id: string;
}
export declare class CloudBreakdownEngine {
    private openai;
    constructor();
    breakdown(request: CloudBreakdownRequest): Promise<CloudBreakdownResult>;
    private createLLMBreakdown;
    private convertToNodes;
    private createSimpleBreakdown;
    private generateSubtasks;
    private createEdgesFromNodes;
}
export declare function getCloudBreakdownEngine(): CloudBreakdownEngine;
