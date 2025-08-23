/**
 * GoTN Core Package
 *
 * This package contains:
 * - Node and edge schemas
 * - .gotn filesystem layer
 * - Graph logic and operations
 * - Data model definitions
 */

export const GOTN_VERSION = "0.1.0";

// Core exports
export * from "./types.js";
export * from "./schemas.js";
export * from "./fsStore.js";
export * from "./nodeStore.js";
export * from "./edgeEngine.js";
export * from "./breakdownEngine.js";
export * from "./planComposer.js";
export * from "./guardEngine.js";
export * from "./logger.js";
export * from "./metrics.js";
export * from "./recovery.js";

console.log(`GoTN Core v${GOTN_VERSION} loaded`);
