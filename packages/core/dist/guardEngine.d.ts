/**
 * GuardEngine - Evaluates guards and artifacts for safe execution
 */
import { Node } from "./schemas.js";
export type GuardResult = "proceed" | "skip" | "fail";
export interface GuardEvaluation {
    result: GuardResult;
    reason: string;
    node_id: string;
}
export declare class GuardEngine {
    constructor();
    /**
     * Check if all produced artifacts exist
     */
    private checkArtifacts;
    /**
     * Evaluate guards for a node
     */
    private evaluateGuards;
    /**
     * Evaluate a node for execution
     */
    evaluate(node: Node): Promise<GuardEvaluation>;
}
export declare function getGuardEngine(): GuardEngine;
