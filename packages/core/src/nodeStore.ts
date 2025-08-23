/**
 * NodeStore - High-level API that combines fsStore and vector operations
 */

import { Node, NodeSchema, JournalEntry } from "./schemas.js";
import {
  readGraph,
  writeGraph,
  appendJournal,
  addNode as fsAddNode,
  updateNode as fsUpdateNode,
} from "./fsStore.js";
// Note: Import vec types - will be resolved at runtime
interface VectorStore {
  upsert(id: string, vec: number[], projectId?: string): Promise<void>;
  search(vec: number[], k: number, projectId?: string): Promise<SearchResult[]>;
}

interface Embeddings {
  embed(text: string): Promise<number[]>;
}

interface SearchResult {
  id: string;
  score: number;
  vector: number[];
}

export interface NodeSearchResult {
  id: string;
  summary: string;
  score: number;
}

export class NodeStore {
  private vectorStore: VectorStore | null = null;
  private embedder: Embeddings | null = null;
  private projectId: string;
  private initialized = false;

  constructor(projectId: string = "default") {
    this.projectId = projectId;
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      // Try to dynamically require vec package at runtime
      const vecModule = require("@gotn/vec");
      this.vectorStore = vecModule.getVectorStore();
      this.embedder = vecModule.getEmbedder();
    } catch (error) {
      console.warn(
        "Vector components not available, using fallback implementations"
      );
      // Fallback to no-op implementations
      this.vectorStore = {
        async upsert() {},
        async search() {
          return [];
        },
      } as VectorStore;
      this.embedder = {
        async embed() {
          return [];
        },
      } as Embeddings;
    }

    this.initialized = true;
  }

  /**
   * Store a node: validate → write → journal → embed → upsert → update embedding_ref
   */
  async storeNode(node: Node): Promise<void> {
    await this.ensureInitialized();

    // 1. Validate the node
    const validatedNode = NodeSchema.parse(node);

    // 2. Write node to graph and append to journal
    await fsAddNode(".", validatedNode);

    // 3. Create embedding text from summary and prompt_text
    const embeddingText = [
      validatedNode.summary,
      validatedNode.prompt_text,
      ...validatedNode.tags,
    ]
      .filter(Boolean)
      .join(" ");

    if (embeddingText.trim() && this.embedder && this.vectorStore) {
      try {
        // 4. Generate embedding
        const embedding = await this.embedder.embed(embeddingText);

        // 5. Upsert vector to vector store
        await this.vectorStore.upsert(
          validatedNode.id,
          embedding,
          this.projectId
        );

        // 6. Update node with embedding reference
        const updatedNode: Node = {
          ...validatedNode,
          embedding_ref: {
            collection: "gotn_nodes",
            id: validatedNode.id,
          },
        };

        // Write updated node back to storage
        await fsUpdateNode(".", updatedNode.id, updatedNode);
      } catch (error: any) {
        console.warn(
          `Failed to create embedding for node ${validatedNode.id}:`,
          error.message
        );
        // Node is still stored, just without embedding
      }
    }
  }

  /**
   * Get a node by its ID
   */
  async getNode(id: string): Promise<Node | null> {
    const graph = await readGraph(".");
    const node = graph.nodes.find((n) => n.id === id);
    return node || null;
  }

  /**
   * Search nodes by text using semantic similarity
   */
  async searchNodesByText(
    query: string,
    limit: number = 10
  ): Promise<NodeSearchResult[]> {
    await this.ensureInitialized();

    if (!query.trim() || !this.embedder || !this.vectorStore) {
      return [];
    }

    try {
      // 1. Generate embedding for query
      const queryEmbedding = await this.embedder.embed(query);

      // 2. Search vector store
      const vectorResults = await this.vectorStore.search(
        queryEmbedding,
        limit,
        this.projectId
      );

      // 3. Get node summaries for results
      const graph = await readGraph(".");
      const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

      const results: NodeSearchResult[] = vectorResults
        .map((result: SearchResult) => {
          const node = nodeMap.get(result.id);
          if (!node) return null;

          return {
            id: result.id,
            summary: node.summary,
            score: result.score,
          };
        })
        .filter((result): result is NodeSearchResult => result !== null);

      return results;
    } catch (error: any) {
      console.warn("Failed to search nodes by text:", error.message);
      return [];
    }
  }

  /**
   * Get all nodes (for debugging/testing)
   */
  async getAllNodes(): Promise<Node[]> {
    const graph = await readGraph(".");
    return graph.nodes;
  }

  /**
   * Get node count
   */
  async getNodeCount(): Promise<number> {
    const graph = await readGraph(".");
    return graph.nodes.length;
  }
}

/**
 * Default NodeStore instance
 */
let defaultNodeStore: NodeStore | null = null;

export function getNodeStore(projectId?: string): NodeStore {
  if (!defaultNodeStore || (projectId && projectId !== "default")) {
    defaultNodeStore = new NodeStore(projectId);
  }
  return defaultNodeStore;
}
