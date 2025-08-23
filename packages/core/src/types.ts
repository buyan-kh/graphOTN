/**
 * Core type definitions for GoTN
 *
 * These types define the data model for nodes, edges, and other
 * core concepts in the GoTN system.
 */

// Re-export types from fsStore for backwards compatibility
export type {
  GoTNNode,
  GoTNEdge,
  GoTNGraph,
  GoTNMeta,
  JournalEntry,
} from "./fsStore.js";
