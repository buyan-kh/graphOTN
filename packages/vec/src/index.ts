/**
 * GoTN Vector Store Package
 *
 * This package handles:
 * - Embedding generation and storage
 * - Vector similarity search
 * - Zilliz integration with local fallback
 * - Semantic edge inference
 */

import { GOTN_VERSION } from "@gotn/core";

export const VEC_VERSION = "0.1.0";

// Placeholder exports - will be expanded with vector store functionality
export * from "./types.js";

console.log(`GoTN Vec v${VEC_VERSION} loaded (Core: ${GOTN_VERSION})`);
