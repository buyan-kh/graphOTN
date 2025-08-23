/**
 * Vector Store tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MemoryVectorStore,
  getVectorStore,
  type VectorStore,
  type SearchResult,
} from "../src/vectorStore.js";

describe("MemoryVectorStore", () => {
  let store: MemoryVectorStore;

  beforeEach(() => {
    store = new MemoryVectorStore();
  });

  describe("Basic Operations", () => {
    it("should upsert vectors successfully", async () => {
      await store.upsert("vec1", [1, 0, 0]);
      await store.upsert("vec2", [0, 1, 0]);

      expect(store.size()).toBe(2);
      expect(store.getAllIds()).toContain("vec1");
      expect(store.getAllIds()).toContain("vec2");
    });

    it("should update existing vectors", async () => {
      await store.upsert("vec1", [1, 0, 0]);
      expect(store.size()).toBe(1);

      await store.upsert("vec1", [0, 1, 0]); // Update same ID
      expect(store.size()).toBe(1);
    });

    it("should handle projectId isolation", async () => {
      await store.upsert("vec1", [1, 0, 0], "project1");
      await store.upsert("vec1", [0, 1, 0], "project2");

      expect(store.size()).toBe(2); // Same ID, different projects
    });
  });

  describe("Input Validation", () => {
    it("should reject empty vectors", async () => {
      await expect(store.upsert("vec1", [])).rejects.toThrow(
        "Vector must be a non-empty array"
      );
    });

    it("should reject non-finite vector components", async () => {
      await expect(store.upsert("vec1", [1, NaN, 0])).rejects.toThrow(
        "All vector components must be finite numbers"
      );

      await expect(store.upsert("vec1", [1, Infinity, 0])).rejects.toThrow(
        "All vector components must be finite numbers"
      );
    });

    it("should reject invalid search parameters", async () => {
      await expect(store.search([], 5)).rejects.toThrow(
        "Query vector must be a non-empty array"
      );

      await expect(store.search([1, 0, 0], 0)).rejects.toThrow(
        "k must be positive"
      );

      await expect(store.search([1, NaN, 0], 5)).rejects.toThrow(
        "All query vector components must be finite numbers"
      );
    });
  });

  describe("Five Item Test (Success Criteria)", () => {
    beforeEach(async () => {
      // Set up five test vectors with known relationships
      await store.upsert("identical", [1, 0, 0]); // Identical to query
      await store.upsert("similar", [0.9, 0.1, 0]); // Very similar
      await store.upsert("somewhat", [0.5, 0.5, 0]); // Somewhat similar
      await store.upsert("different", [0, 1, 0]); // Orthogonal
      await store.upsert("opposite", [-1, 0, 0]); // Opposite direction
    });

    it("should find all five items", async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, 5);

      expect(results).toHaveLength(5);

      const resultIds = results.map((r) => r.id);
      expect(resultIds).toContain("identical");
      expect(resultIds).toContain("similar");
      expect(resultIds).toContain("somewhat");
      expect(resultIds).toContain("different");
      expect(resultIds).toContain("opposite");
    });

    it("should return results in descending score order", async () => {
      const query = [1, 0, 0];
      const results = await store.search(query, 5);

      expect(results).toHaveLength(5);

      // Check that scores are in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }

      // Check expected ordering based on cosine similarity
      expect(results[0].id).toBe("identical"); // Should be highest (score = 1)
      expect(results[1].id).toBe("similar"); // Should be second highest
      expect(results[4].id).toBe("opposite"); // Should be lowest (score = -1)

      // Verify actual score values
      expect(results[0].score).toBeCloseTo(1.0, 5);
      expect(results[4].score).toBeCloseTo(-1.0, 5);
    });

    it("should respect k parameter", async () => {
      const query = [1, 0, 0];

      const results1 = await store.search(query, 1);
      expect(results1).toHaveLength(1);
      expect(results1[0].id).toBe("identical");

      const results3 = await store.search(query, 3);
      expect(results3).toHaveLength(3);
      expect(results3[0].id).toBe("identical");
      expect(results3[1].id).toBe("similar");
    });
  });

  describe("Cosine Similarity", () => {
    it("should calculate correct cosine similarities", async () => {
      // Test known cosine similarity values
      await store.upsert("same", [1, 0, 0]);
      await store.upsert("orthogonal", [0, 1, 0]);
      await store.upsert("opposite", [-1, 0, 0]);
      await store.upsert("diagonal", [1, 1, 0]);

      const query = [1, 0, 0];
      const results = await store.search(query, 4);

      // Find specific results
      const same = results.find((r) => r.id === "same")!;
      const orthogonal = results.find((r) => r.id === "orthogonal")!;
      const opposite = results.find((r) => r.id === "opposite")!;
      const diagonal = results.find((r) => r.id === "diagonal")!;

      expect(same.score).toBeCloseTo(1.0, 5);
      expect(orthogonal.score).toBeCloseTo(0.0, 5);
      expect(opposite.score).toBeCloseTo(-1.0, 5);
      expect(diagonal.score).toBeCloseTo(1 / Math.sqrt(2), 5); // cos(45°) = 1/√2
    });
  });

  describe("Project Isolation", () => {
    beforeEach(async () => {
      await store.upsert("vec1", [1, 0, 0], "project1");
      await store.upsert("vec2", [0, 1, 0], "project1");
      await store.upsert("vec1", [0, 0, 1], "project2");
      await store.upsert("vec3", [1, 1, 0], "project2");
      await store.upsert("vec4", [1, 0, 1]); // No project
    });

    it("should filter by projectId", async () => {
      const query = [1, 0, 0];

      const project1Results = await store.search(query, 5, "project1");
      expect(project1Results).toHaveLength(2);
      expect(project1Results.every((r) => r.projectId === "project1")).toBe(
        true
      );

      const project2Results = await store.search(query, 5, "project2");
      expect(project2Results).toHaveLength(2);
      expect(project2Results.every((r) => r.projectId === "project2")).toBe(
        true
      );

      const allResults = await store.search(query, 5);
      expect(allResults).toHaveLength(5); // All vectors
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero vectors", async () => {
      await store.upsert("zero", [0, 0, 0]);
      await store.upsert("normal", [1, 0, 0]);

      const results = await store.search([1, 0, 0], 2);
      expect(results).toHaveLength(2);

      const zeroResult = results.find((r) => r.id === "zero")!;
      expect(zeroResult.score).toBe(0); // Cosine similarity with zero vector is 0
    });

    it("should handle dimension mismatches", async () => {
      await store.upsert("vec1", [1, 0, 0]);

      // This should not throw during upsert, but will during search
      await expect(store.search([1, 0], 1)).rejects.toThrow(
        "Vector dimensions don't match"
      );
    });

    it("should handle empty store", async () => {
      const results = await store.search([1, 0, 0], 5);
      expect(results).toHaveLength(0);
    });
  });
});

describe("Factory Function", () => {
  it("should return a MemoryVectorStore by default", () => {
    const store = getVectorStore();
    expect(store).toBeInstanceOf(MemoryVectorStore);
  });

  it("should return a working vector store", async () => {
    const store = getVectorStore();

    await store.upsert("test", [1, 0, 0]);
    const results = await store.search([1, 0, 0], 1);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("test");
    expect(results[0].score).toBeCloseTo(1.0, 5);
  });
});
