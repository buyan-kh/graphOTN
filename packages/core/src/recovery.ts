/**
 * Recovery utilities for GoTN
 */

import { readJournal, writeGraph, initStore } from "./fsStore.js";
import { NodeSchema, EdgeSchema, JournalEntry } from "./schemas.js";
import { getLogger } from "./logger.js";
import { existsSync } from "fs";

export interface RecoveryResult {
  nodes_recovered: number;
  edges_recovered: number;
  skipped_entries: number;
  corrupt_entries: string[];
  success: boolean;
  message: string;
}

export class RecoveryEngine {
  private workspacePath: string;
  private logger;

  constructor(workspacePath: string = ".") {
    this.workspacePath = workspacePath;
    this.logger = getLogger(workspacePath);
  }

  async recover(): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      nodes_recovered: 0,
      edges_recovered: 0,
      skipped_entries: 0,
      corrupt_entries: [],
      success: false,
      message: "",
    };

    try {
      await this.logger.info("Starting recovery process", {
        workspace: this.workspacePath,
      });

      // Ensure workspace exists
      if (!existsSync(this.workspacePath)) {
        await initStore(this.workspacePath);
      }

      // Read journal entries
      const journalEntries = await readJournal(this.workspacePath);

      if (journalEntries.length === 0) {
        result.message = "No journal entries found - nothing to recover";
        result.success = true;
        return result;
      }

      await this.logger.info(`Found ${journalEntries.length} journal entries`);

      // Rebuild graph from journal
      const nodes = new Map();
      const edges = new Map();

      for (const entry of journalEntries) {
        try {
          await this.processJournalEntry(entry, nodes, edges);

          if (entry.event === "add_node") {
            result.nodes_recovered++;
          } else if (entry.event === "add_edge") {
            result.edges_recovered++;
          }
        } catch (error: any) {
          result.skipped_entries++;
          result.corrupt_entries.push(`${entry.event}: ${error.message}`);
          await this.logger.warn("Skipped corrupt journal entry", {
            event: entry.event,
            error: error.message,
          });
        }
      }

      // Write recovered graph
      const recoveredGraph = {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edges.values()),
        version: 1,
      };

      await writeGraph(this.workspacePath, recoveredGraph as any);

      result.success = true;
      result.message = `Recovery completed: ${result.nodes_recovered} nodes, ${result.edges_recovered} edges recovered`;

      if (result.skipped_entries > 0) {
        result.message += `. ${result.skipped_entries} corrupt entries skipped`;
      }

      await this.logger.info("Recovery completed successfully", result);

      return result;
    } catch (error: any) {
      result.success = false;
      result.message = `Recovery failed: ${error.message}`;
      await this.logger.error("Recovery failed", { error: error.message });
      return result;
    }
  }

  private async processJournalEntry(
    entry: JournalEntry,
    nodes: Map<string, any>,
    edges: Map<string, any>
  ): Promise<void> {
    switch (entry.event) {
      case "add_node":
        if (entry.data?.node) {
          const validatedNode = NodeSchema.parse(entry.data.node);
          nodes.set(validatedNode.id, validatedNode);
        }
        break;

      case "update_node":
        if (entry.data?.node) {
          const validatedNode = NodeSchema.parse(entry.data.node);
          nodes.set(validatedNode.id, validatedNode);
        }
        break;

      case "add_edge":
        if (entry.data?.edge) {
          const validatedEdge = EdgeSchema.parse(entry.data.edge);
          const edgeKey = `${validatedEdge.src}-${validatedEdge.dst}-${validatedEdge.type}`;
          edges.set(edgeKey, validatedEdge);
        }
        break;

      case "workspace_initialized":
        // Skip workspace events
        break;

      default:
        // Skip unknown events
        break;
    }
  }

  async verifyIntegrity(): Promise<{
    nodes: number;
    edges: number;
    valid: boolean;
  }> {
    try {
      const graph = await import("./fsStore.js").then((m) =>
        m.readGraph(this.workspacePath)
      );

      // Basic integrity checks
      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      let validEdges = 0;

      for (const edge of graph.edges) {
        if (nodeIds.has(edge.src) && nodeIds.has(edge.dst)) {
          validEdges++;
        }
      }

      const valid = validEdges === graph.edges.length;

      return {
        nodes: graph.nodes.length,
        edges: validEdges,
        valid,
      };
    } catch (error) {
      return { nodes: 0, edges: 0, valid: false };
    }
  }
}

export function getRecoveryEngine(workspacePath?: string): RecoveryEngine {
  return new RecoveryEngine(workspacePath || ".");
}
