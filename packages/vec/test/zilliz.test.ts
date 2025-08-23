/**
 * Zilliz client tests
 * 
 * These tests require ZILLIZ_URI and ZILLIZ_TOKEN environment variables
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  connectZilliz,
  ensureCollection,
  upsertVector,
  searchKnn,
  getCollectionStats,
  checkConnection,
} from "../src/zilliz.js";
import type { MilvusClient } from "@zilliz/milvus2-sdk-node";

describe("Zilliz Client", () => {
  let client: MilvusClient | null = null;
  const hasZillizCredentials = process.env.ZILLIZ_URI && process.env.ZILLIZ_TOKEN;

  beforeAll(async () => {
    if (!hasZillizCredentials) {
      console.log("⚠️  Skipping Zilliz tests - ZILLIZ_URI and ZILLIZ_TOKEN not set");
      return;
    }
  });

  afterAll(async () => {
    // Cleanup would go here if needed
    // Note: We don't delete the collection as it might contain important data
  });

  describe("Connection", () => {
    it("should throw error when ZILLIZ_URI is missing", () => {
      const originalUri = process.env.ZILLIZ_URI;
      delete process.env.ZILLIZ_URI;

      expect(() => connectZilliz()).toThrow("ZILLIZ_URI environment variable is required");

      // Restore
      if (originalUri) process.env.ZILLIZ_URI = originalUri;
    });

    it("should throw error when ZILLIZ_TOKEN is missing", () => {
      const originalUri = process.env.ZILLIZ_URI;
      const originalToken = process.env.ZILLIZ_TOKEN;
      
      // Set URI but delete TOKEN to test token validation
      process.env.ZILLIZ_URI = "https://test.zilliz.com";
      delete process.env.ZILLIZ_TOKEN;

      expect(() => connectZilliz()).toThrow("ZILLIZ_TOKEN environment variable is required");

      // Restore
      if (originalUri) process.env.ZILLIZ_URI = originalUri;
      if (originalToken) process.env.ZILLIZ_TOKEN = originalToken;
    });

    it("should create client with SSL enabled", () => {
      if (!hasZillizCredentials) return;

      const testClient = connectZilliz();
      expect(testClient).toBeDefined();
      
      // Store for other tests
      client = testClient;
    });

    it("should check connection health", async () => {
      if (!hasZillizCredentials || !client) return;

      const isHealthy = await checkConnection(client);
      expect(isHealthy).toBe(true);
    }, 30000); // 30 second timeout for network call
  });

  describe("Collection Management", () => {
    it("should ensure collection exists and is loaded", async () => {
      if (!hasZillizCredentials || !client) return;

      // This should create the collection if it doesn't exist, or load it if it does
      await expect(ensureCollection(client)).resolves.not.toThrow();
      
      // Verify collection exists by getting stats
      const stats = await getCollectionStats(client);
      expect(stats).toHaveProperty("count");
      expect(stats).toHaveProperty("indexedCount");
      expect(typeof stats.count).toBe("number");
      expect(typeof stats.indexedCount).toBe("number");
    }, 60000); // 60 second timeout for collection creation/loading
  });

  describe("Vector Operations", () => {
    const testVectors = [
      { id: "test_vec_1", embedding: [1, 0, 0, 0], projectId: "test_project" },
      { id: "test_vec_2", embedding: [0, 1, 0, 0], projectId: "test_project" },
      { id: "test_vec_3", embedding: [0.707, 0.707, 0, 0], projectId: "test_project" },
      { id: "test_vec_4", embedding: [0, 0, 1, 0], projectId: "other_project" },
    ];

    it("should upsert vectors successfully", async () => {
      if (!hasZillizCredentials || !client) return;

      // Upsert test vectors
      for (const vector of testVectors) {
        await expect(
          upsertVector(client, vector.id, vector.embedding, vector.projectId)
        ).resolves.not.toThrow();
      }

      // Wait a moment for indexing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }, 30000);

    it("should search and return results in descending score order", async () => {
      if (!hasZillizCredentials || !client) return;

      // Search for vectors similar to [1, 0, 0, 0] in test_project
      const queryVector = [1, 0, 0, 0];
      const results = await searchKnn(client, queryVector, 3, "test_project");

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);

      // Check that results are in descending score order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }

      // The most similar should be test_vec_1 (identical vector)
      const topResult = results[0];
      expect(topResult.id).toBe("test_vec_1");
      expect(topResult.score).toBeCloseTo(1.0, 2); // Cosine similarity of identical vectors
      expect(topResult.project_id).toBe("test_project");

      console.log("Search results:", results.map(r => ({ 
        id: r.id, 
        score: r.score.toFixed(4),
        project_id: r.project_id 
      })));
    }, 30000);

    it("should filter by project_id", async () => {
      if (!hasZillizCredentials || !client) return;

      const queryVector = [1, 0, 0, 0];

      // Search in test_project only
      const testProjectResults = await searchKnn(client, queryVector, 10, "test_project");
      expect(testProjectResults.every(r => r.project_id === "test_project")).toBe(true);

      // Search in other_project only
      const otherProjectResults = await searchKnn(client, queryVector, 10, "other_project");
      expect(otherProjectResults.every(r => r.project_id === "other_project")).toBe(true);

      // Search without filter (should include both projects)
      const allResults = await searchKnn(client, queryVector, 10);
      const projectIds = new Set(allResults.map(r => r.project_id));
      expect(projectIds.size).toBeGreaterThan(1); // Should have multiple projects
    }, 30000);

    it("should handle empty search results gracefully", async () => {
      if (!hasZillizCredentials || !client) return;

      // Search in a non-existent project
      const results = await searchKnn(client, [1, 0, 0, 0], 5, "non_existent_project");
      expect(results).toEqual([]);
    }, 30000);
  });

  describe("Statistics", () => {
    it("should get collection statistics", async () => {
      if (!hasZillizCredentials || !client) return;

      const stats = await getCollectionStats(client);
      
      expect(stats).toHaveProperty("count");
      expect(stats).toHaveProperty("indexedCount");
      expect(stats.count).toBeGreaterThanOrEqual(0);
      expect(stats.indexedCount).toBeGreaterThanOrEqual(0);

      console.log("Collection stats:", stats);
    }, 30000);
  });
});
