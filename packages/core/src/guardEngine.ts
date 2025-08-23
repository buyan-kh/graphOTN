/**
 * GuardEngine - Evaluates guards and artifacts for safe execution
 */

import { Node } from "./schemas.js";
import { existsSync } from "fs";
import path from "path";

export type GuardResult = "proceed" | "skip" | "fail";

export interface GuardEvaluation {
  result: GuardResult;
  reason: string;
  node_id: string;
}

export class GuardEngine {
  constructor() {}

  /**
   * Check if all produced artifacts exist
   */
  private checkArtifacts(node: Node): {
    allExist: boolean;
    existingFiles: string[];
  } {
    const existingFiles: string[] = [];

    // Check files in artifacts
    for (const file of node.artifacts?.files || []) {
      const filePath = path.resolve(file);
      if (existsSync(filePath)) {
        existingFiles.push(file);
      }
    }

    // For now, we consider "all exist" if any files exist
    // This is a simple heuristic - in real implementation this would be more sophisticated
    const allExist =
      existingFiles.length > 0 &&
      existingFiles.length >= (node.artifacts?.files?.length || 0);

    return { allExist, existingFiles };
  }

  /**
   * Evaluate guards for a node
   */
  private evaluateGuards(node: Node): {
    passed: boolean;
    failedGuard?: string;
  } {
    // For now, we simulate guard evaluation
    // In real implementation, this would execute actual guard logic

    for (const guard of node.guards || []) {
      // Simple guard simulation - fail if guard mentions "missing" or "unavailable"
      if (
        guard.toLowerCase().includes("missing") ||
        guard.toLowerCase().includes("unavailable")
      ) {
        return { passed: false, failedGuard: guard };
      }

      // Port availability check simulation
      if (guard.includes("port") && guard.includes("9092")) {
        // Simulate port check - randomly fail 20% of the time for testing
        if (Math.random() < 0.2) {
          return { passed: false, failedGuard: guard };
        }
      }
    }

    return { passed: true };
  }

  /**
   * Evaluate a node for execution
   */
  async evaluate(node: Node): Promise<GuardEvaluation> {
    // 1. Check guards first
    const guardResult = this.evaluateGuards(node);
    if (!guardResult.passed) {
      return {
        result: "fail",
        reason: `Guard failed: ${guardResult.failedGuard}`,
        node_id: node.id,
      };
    }

    // 2. Check if artifacts already exist
    const { allExist, existingFiles } = this.checkArtifacts(node);
    if (allExist && existingFiles.length > 0) {
      return {
        result: "skip",
        reason: `All required artifacts exist: ${existingFiles.join(", ")}`,
        node_id: node.id,
      };
    }

    // 3. Proceed with execution
    return {
      result: "proceed",
      reason: "All guards passed and artifacts need to be created",
      node_id: node.id,
    };
  }
}

let defaultGuardEngine: GuardEngine | null = null;

export function getGuardEngine(): GuardEngine {
  if (!defaultGuardEngine) {
    defaultGuardEngine = new GuardEngine();
  }
  return defaultGuardEngine;
}
