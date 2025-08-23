/**
 * EdgeEngine - Automatic edge inference for GoTN graphs
 *
 * Creates two types of edges:
 * 1. Hard edges: structural dependencies from requires/produces tags
 * 2. Soft edges: semantic similarity from embedding vectors
 */

import { Node, Edge, EdgeSchema } from "./schemas.js";
import { readGraph, writeGraph, addEdge } from "./fsStore.js";

export interface EdgeInferenceResult {
  hardEdges: Edge[];
  softEdges: Edge[];
  totalEdgesCreated: number;
}

export interface SoftEdgeCandidate {
  nodeA: Node;
  nodeB: Node;
  score: number;
  evidence: string;
}

export class EdgeEngine {
  private vectorStore: any = null;
  private initialized = false;

  constructor() {}

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      // Try to dynamically require vec package at runtime
      const vecModule = require("@gotn/vec");
      this.vectorStore = vecModule.getVectorStore();
    } catch (error) {
      console.warn("Vector components not available for soft edge inference");
      this.vectorStore = null;
    }

    this.initialized = true;
  }

  /**
   * Infer hard edges based on requires/produces tag matching
   */
  async inferHardEdges(nodes: Node[]): Promise<Edge[]> {
    const hardEdges: Edge[] = [];
    const currentTime = new Date().toISOString();

    // Create a map of what each node produces
    const producersMap = new Map<string, Node[]>();

    for (const node of nodes) {
      for (const tag of node.produces) {
        if (!producersMap.has(tag)) {
          producersMap.set(tag, []);
        }
        producersMap.get(tag)!.push(node);
      }
    }

    // For each node, check if its requirements are produced by other nodes
    for (const nodeA of nodes) {
      for (const requiredTag of nodeA.requires) {
        const producers = producersMap.get(requiredTag);

        if (producers) {
          for (const nodeB of producers) {
            // Don't create self-edges
            if (nodeA.id === nodeB.id) continue;

            // Create hard edge from A to B (A requires what B produces)
            const edge: Edge = {
              src: nodeA.id,
              dst: nodeB.id,
              type: "hard_requires",
              evidence: `${nodeA.id} requires "${requiredTag}" which ${nodeB.id} produces`,
              provenance: {
                created_by: "edge_engine",
                source: "hard_inference",
                created_at: currentTime,
              },
              version: 1,
              created_at: currentTime,
              updated_at: currentTime,
            };

            hardEdges.push(edge);
          }
        }
      }
    }

    return hardEdges;
  }

  /**
   * Infer soft edges based on semantic similarity
   */
  async inferSoftEdges(
    nodes: Node[],
    k: number = 5,
    threshold: number = 0.78
  ): Promise<Edge[]> {
    await this.ensureInitialized();

    if (!this.vectorStore) {
      console.warn("Vector store not available, skipping soft edge inference");
      return [];
    }

    const softEdges: Edge[] = [];
    const currentTime = new Date().toISOString();

    // Find candidates for each node
    const candidates: SoftEdgeCandidate[] = [];

    for (const node of nodes) {
      // Skip nodes without embeddings
      if (!node.embedding_ref) continue;

      try {
        // Search for similar nodes using the vector store
        // We'll use the node's summary as the search query to find similar nodes
        const searchText = [node.summary, ...node.tags].join(" ");

        // Get embedding for this node's content
        const vecModule = require("@gotn/vec");
        const embedder = vecModule.getEmbedder();
        const nodeEmbedding = await embedder.embed(searchText);

        // Search for k nearest neighbors
        const searchResults = await this.vectorStore.search(
          nodeEmbedding,
          k + 1
        ); // +1 to account for self-match

        for (const result of searchResults) {
          // Skip self-matches
          if (result.id === node.id) continue;

          // Skip if score is below threshold
          if (result.score < threshold) continue;

          // Find the corresponding node
          const similarNode = nodes.find((n) => n.id === result.id);
          if (!similarNode) continue;

          candidates.push({
            nodeA: node,
            nodeB: similarNode,
            score: result.score,
            evidence: `Semantic similarity: ${result.score.toFixed(
              4
            )} (>${threshold})`,
          });
        }
      } catch (error: any) {
        console.warn(
          `Failed to find similar nodes for ${node.id}:`,
          error.message
        );
      }
    }

    // Filter for mutual nearest neighbors
    const mutualPairs = new Set<string>();

    for (const candidateAB of candidates) {
      // Look for the reverse relationship
      const candidateBA = candidates.find(
        (c) =>
          c.nodeA.id === candidateAB.nodeB.id &&
          c.nodeB.id === candidateAB.nodeA.id
      );

      if (candidateBA) {
        // Create a consistent pair key (smaller ID first)
        const pairKey =
          candidateAB.nodeA.id < candidateAB.nodeB.id
            ? `${candidateAB.nodeA.id}-${candidateAB.nodeB.id}`
            : `${candidateAB.nodeB.id}-${candidateAB.nodeA.id}`;

        if (!mutualPairs.has(pairKey)) {
          mutualPairs.add(pairKey);

          // Use the higher score of the two directions
          const score = Math.max(candidateAB.score, candidateBA.score);

          // Create bidirectional soft edges
          const edgeAB: Edge = {
            src: candidateAB.nodeA.id,
            dst: candidateAB.nodeB.id,
            type: "soft_semantic",
            score: score,
            evidence: `Mutual semantic similarity: ${score.toFixed(
              4
            )} (mutual nearest neighbors)`,
            provenance: {
              created_by: "edge_engine",
              source: "soft_inference",
              created_at: currentTime,
            },
            version: 1,
            created_at: currentTime,
            updated_at: currentTime,
          };

          const edgeBA: Edge = {
            src: candidateAB.nodeB.id,
            dst: candidateAB.nodeA.id,
            type: "soft_semantic",
            score: score,
            evidence: `Mutual semantic similarity: ${score.toFixed(
              4
            )} (mutual nearest neighbors)`,
            provenance: {
              created_by: "edge_engine",
              source: "soft_inference",
              created_at: currentTime,
            },
            version: 1,
            created_at: currentTime,
            updated_at: currentTime,
          };

          softEdges.push(edgeAB, edgeBA);
        }
      }
    }

    return softEdges;
  }

  /**
   * Infer all edges for the given node IDs
   */
  async inferEdges(nodeIds?: string[]): Promise<EdgeInferenceResult> {
    const graph = await readGraph(".");

    // Filter nodes if specific IDs provided
    const targetNodes = nodeIds
      ? graph.nodes.filter((node) => nodeIds.includes(node.id))
      : graph.nodes;

    if (targetNodes.length === 0) {
      return {
        hardEdges: [],
        softEdges: [],
        totalEdgesCreated: 0,
      };
    }

    // Infer hard edges
    console.log(`Inferring hard edges for ${targetNodes.length} nodes...`);
    const hardEdges = await this.inferHardEdges(targetNodes);

    // Infer soft edges
    console.log(`Inferring soft edges for ${targetNodes.length} nodes...`);
    const softEdges = await this.inferSoftEdges(targetNodes);

    // Persist all edges
    for (const edge of [...hardEdges, ...softEdges]) {
      try {
        await addEdge(".", edge);
      } catch (error: any) {
        console.warn(
          `Failed to add edge ${edge.src} -> ${edge.dst}:`,
          error.message
        );
      }
    }

    console.log(
      `Created ${hardEdges.length} hard edges and ${softEdges.length} soft edges`
    );

    return {
      hardEdges,
      softEdges,
      totalEdgesCreated: hardEdges.length + softEdges.length,
    };
  }
}

/**
 * Default EdgeEngine instance
 */
let defaultEdgeEngine: EdgeEngine | null = null;

export function getEdgeEngine(): EdgeEngine {
  if (!defaultEdgeEngine) {
    defaultEdgeEngine = new EdgeEngine();
  }
  return defaultEdgeEngine;
}
