/**
 * Embeddings tests - smoke tests for OpenAI embeddings
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getEmbedder, OpenAIEmbedder } from "../src/embeddings.js";

describe("OpenAI Embeddings", () => {
  const expectedDim = Number(process.env.GOTN_EMBED_DIM) || 1536;

  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for embeddings tests"
      );
    }
  });

  it("should throw error when OPENAI_API_KEY is missing", () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => new OpenAIEmbedder()).toThrow("OPENAI_API_KEY missing");

    // Restore the key
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("should embed 'hello world' and return array of expected length", async () => {
    const embedder = getEmbedder();
    const embedding = await embedder.embed("hello world");

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(expectedDim);

    // All numbers should be finite
    embedding.forEach((num, index) => {
      expect(Number.isFinite(num)).toBe(true);
      expect(typeof num).toBe("number");
    });
  }, 30000); // 30 second timeout for API call

  it("should return consistent array length for different strings", async () => {
    const embedder = getEmbedder();

    const embedding1 = await embedder.embed("hello world");
    const embedding2 = await embedder.embed("goodbye world");

    expect(embedding1.length).toBe(expectedDim);
    expect(embedding2.length).toBe(expectedDim);
    expect(embedding1.length).toBe(embedding2.length);

    // Embeddings should be different for different text
    expect(embedding1).not.toEqual(embedding2);
  }, 30000); // 30 second timeout for API calls

  it("should handle empty string", async () => {
    const embedder = getEmbedder();
    const embedding = await embedder.embed("");

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(expectedDim);
  }, 30000);

  it("should handle longer text", async () => {
    const embedder = getEmbedder();
    const longText =
      "This is a longer piece of text that should still be embedded properly by the OpenAI API. It contains multiple sentences and should test the embedding functionality with more substantial input.";

    const embedding = await embedder.embed(longText);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(expectedDim);

    // All numbers should be finite
    embedding.forEach((num) => {
      expect(Number.isFinite(num)).toBe(true);
    });
  }, 30000);

  it("should respect custom dimension if provided", async () => {
    if (expectedDim !== 1536) {
      const embedder = new OpenAIEmbedder(expectedDim);
      const embedding = await embedder.embed("test");

      expect(embedding.length).toBe(expectedDim);
    }
  }, 30000);
});
