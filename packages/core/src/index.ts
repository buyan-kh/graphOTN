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

console.log(`GoTN Core v${GOTN_VERSION} loaded`);
