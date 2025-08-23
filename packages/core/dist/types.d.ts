/**
 * Core type definitions for GoTN
 *
 * These types define the data model for nodes, edges, and other
 * core concepts in the GoTN system.
 */
export interface GoTNNode {
    id: string;
    kind: string;
    summary: string;
}
export interface GoTNEdge {
    from: string;
    to: string;
    type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
}
