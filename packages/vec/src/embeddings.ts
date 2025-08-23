/**
 * OpenAI Embeddings Interface and Implementation
 */

import OpenAI from "openai";

/**
 * Generic embeddings interface
 */
export interface Embeddings {
  embed(text: string): Promise<number[]>;
}

/**
 * OpenAI embeddings implementation with retry logic
 */
export class OpenAIEmbedder implements Embeddings {
  private client: OpenAI;
  private model = "text-embedding-3-small";

  constructor(private dim = Number(process.env.GOTN_EMBED_DIM) || 1536) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Retry helper for handling rate limits and transient errors
   */
  private async withRetry<T>(op: () => Promise<T>): Promise<T> {
    let delay = 250;
    for (let i = 0; i < 3; i++) {
      try {
        return await op();
      } catch (err: any) {
        const code = err?.status || err?.code;
        if (code === 429 || (code >= 500 && code < 600)) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
    return op();
  }

  /**
   * Generate embedding for the given text
   */
  async embed(text: string): Promise<number[]> {
    const res = await this.withRetry(() =>
      this.client.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dim,
      })
    );

    const v = res.data[0].embedding as number[];
    if (!Array.isArray(v) || v.length !== this.dim) {
      throw new Error(
        `Unexpected embedding length ${v.length} expected ${this.dim}`
      );
    }
    return v;
  }
}

/**
 * Factory function to get an embedder instance
 */
export function getEmbedder(): Embeddings {
  const dim = Number(process.env.GOTN_EMBED_DIM) || 1536;
  return new OpenAIEmbedder(dim);
}
