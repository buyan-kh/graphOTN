/**
 * Core type definitions for GoTN
 *
 * These types define the data model for nodes, edges, and other
 * core concepts in the GoTN system.
 */

// Placeholder type - will be expanded with the actual Node schema
export interface GoTNNode {
  id: string;
  kind: string;
  summary: string;
  // More fields will be added based on the data model
}

// Placeholder type - will be expanded with edge types
export interface GoTNEdge {
  from: string;
  to: string;
  type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
}
