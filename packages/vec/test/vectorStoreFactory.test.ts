/**
 * Vector Store Factory Tests
 * Tests the smart switching between ZillizVectorStore and MemoryVectorStore
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getVectorStore,
  MemoryVectorStore,
  ZillizVectorStore,
} from "../src/vectorStore.js";

// Load environment variables for tests
import "../load-env.js";

describe("Vector Store Factory", () => {
  let originalZillizUri: string | undefined;
  let originalZillizToken: string | undefined;

  beforeAll(() => {
    // Store original env vars
    originalZillizUri = process.env.ZILLIZ_URI;
    originalZillizToken = process.env.ZILLIZ_TOKEN;
  });

  afterAll(() => {
    // Restore original env vars
    if (originalZillizUri) process.env.ZILLIZ_URI = originalZillizUri;
    if (originalZillizToken) process.env.ZILLIZ_TOKEN = originalZillizToken;
  });

  describe("Environment-based Selection", () => {
    it("should return MemoryVectorStore when Zilliz credentials are missing", () => {
      // Clear Zilliz credentials
      delete process.env.ZILLIZ_URI;
      delete process.env.ZILLIZ_TOKEN;

      const store = getVectorStore();
      expect(store).toBeInstanceOf(MemoryVectorStore);
    });

    it("should return MemoryVectorStore when only ZILLIZ_URI is set", () => {
      process.env.ZILLIZ_URI = "https://test.zilliz.com";
      delete process.env.ZILLIZ_TOKEN;

      const store = getVectorStore();
      expect(store).toBeInstanceOf(MemoryVectorStore);
    });

    it("should return MemoryVectorStore when only ZILLIZ_TOKEN is set", () => {
      delete process.env.ZILLIZ_URI;
      process.env.ZILLIZ_TOKEN = "test-token";

      const store = getVectorStore();
      expect(store).toBeInstanceOf(MemoryVectorStore);
    });

    it("should return ZillizVectorStore when both credentials are set", () => {
      process.env.ZILLIZ_URI = "https://test.zilliz.com";
      process.env.ZILLIZ_TOKEN = "test-token";

      const store = getVectorStore();
      expect(store).toBeInstanceOf(ZillizVectorStore);
    });

    it("should return ZillizVectorStore when real credentials are available", () => {
      if (originalZillizUri && originalZillizToken) {
        process.env.ZILLIZ_URI = originalZillizUri;
        process.env.ZILLIZ_TOKEN = originalZillizToken;

        const store = getVectorStore();
        expect(store).toBeInstanceOf(ZillizVectorStore);
      } else {
        console.log(
          "⚠️  Skipping real credentials test - ZILLIZ_URI/TOKEN not set"
        );
      }
    });
  });

  describe("Fallback Behavior", () => {
    it("should return ZillizVectorStore when credentials are set (errors handled at runtime)", () => {
      // Set invalid credentials - factory still returns ZillizVectorStore
      process.env.ZILLIZ_URI = "invalid-uri";
      process.env.ZILLIZ_TOKEN = "invalid-token";

      const store = getVectorStore();
      // Factory returns ZillizVectorStore - errors will be caught during operations
      expect(store).toBeInstanceOf(ZillizVectorStore);
    });
  });
});

describe("ZillizVectorStore", () => {
  let store: ZillizVectorStore;
  const hasZillizCredentials =
    process.env.ZILLIZ_URI && process.env.ZILLIZ_TOKEN;

  beforeAll(() => {
    if (!hasZillizCredentials) {
      console.log(
        "⚠️  Skipping ZillizVectorStore tests - credentials not available"
      );
      return;
    }
    store = new ZillizVectorStore();
  });

  describe("Input Validation", () => {
    it("should validate vector input for upsert", async () => {
      if (!hasZillizCredentials) return;

      await expect(store.upsert("test", [])).rejects.toThrow(
        "Vector must be a non-empty array"
      );
      await expect(store.upsert("test", [1, NaN, 3])).rejects.toThrow(
        "All vector components must be finite"
      );
    });

    it("should validate vector input for search", async () => {
      if (!hasZillizCredentials) return;

      await expect(store.search([], 5)).rejects.toThrow(
        "Query vector must be a non-empty array"
      );
      await expect(store.search([1, NaN, 3], 5)).rejects.toThrow(
        "All query vector components must be finite"
      );
      await expect(store.search([1, 2, 3], 0)).rejects.toThrow(
        "k must be positive"
      );
    });
  });

  describe("Basic Operations", () => {
    it("should upsert and search vectors successfully", async () => {
      if (!hasZillizCredentials) return;

      // Create proper 1536D vectors for Zilliz
      const create1536Vector = (pattern: number[]) => {
        const vec = new Array(1536).fill(0);
        pattern.forEach((val, i) => {
          if (i < vec.length) vec[i] = val;
        });
        return vec;
      };

      const testVectors = [
        {
          id: `zilliz_test_1_${Date.now()}`,
          vector: create1536Vector([1, 0, 0, 0]),
        },
        {
          id: `zilliz_test_2_${Date.now()}`,
          vector: create1536Vector([0, 1, 0, 0]),
        },
        {
          id: `zilliz_test_3_${Date.now()}`,
          vector: create1536Vector([0.707, 0.707, 0, 0]),
        },
      ];

      // Upsert test vectors
      for (const testVec of testVectors) {
        await expect(
          store.upsert(testVec.id, testVec.vector, "factory_test")
        ).resolves.not.toThrow();
      }

      // Wait for indexing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Search for similar vectors
      const results = await store.search(
        create1536Vector([1, 0, 0, 0]),
        3,
        "factory_test"
      );

      // Results should be ordered by score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }

      console.log(
        "ZillizVectorStore search results:",
        results.map((r) => ({
          id: r.id,
          score: r.score.toFixed(4),
        }))
      );
    }, 30000);
  });
});

describe("Cross-Store Compatibility", () => {
  it("should maintain consistent interface between MemoryVectorStore and ZillizVectorStore", async () => {
    // Test MemoryVectorStore
    const memoryStore = new MemoryVectorStore();
    await memoryStore.upsert("test1", [1, 0, 0]);
    await memoryStore.upsert("test2", [0, 1, 0]);

    const memoryResults = await memoryStore.search([1, 0, 0], 2);
    expect(memoryResults).toHaveLength(2);
    expect(memoryResults[0].score).toBeGreaterThanOrEqual(
      memoryResults[1].score
    );

    // Test that both stores have the same interface
    const factoryStore = getVectorStore();

    // Should work regardless of which implementation is returned
    await expect(
      factoryStore.upsert("compat_test", [1, 1, 1])
    ).resolves.not.toThrow();
    const factoryResults = await factoryStore.search([1, 1, 1], 1);

    // Results should have consistent structure
    expect(factoryResults).toBeInstanceOf(Array);
    if (factoryResults.length > 0) {
      expect(factoryResults[0]).toHaveProperty("id");
      expect(factoryResults[0]).toHaveProperty("score");
      expect(factoryResults[0]).toHaveProperty("vector");
    }
  });
});
