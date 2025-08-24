/**
 * GoTN Zod Schemas for Validation
 *
 * Defines strict validation schemas for all data structures
 * to ensure type safety and data integrity.
 */

import { z } from "zod";

// Base schemas for common fields
export const IdSchema = z.string().min(1, "ID cannot be empty");
export const TimestampSchema = z
  .string()
  .datetime("Invalid ISO datetime format");
export const VersionSchema = z
  .number()
  .int()
  .positive("Version must be a positive integer");

// Embedding reference schema
export const EmbeddingRefSchema = z.object({
  collection: z.string().min(1, "Collection name cannot be empty"),
  id: z.string().min(1, "Embedding ID cannot be empty"),
});

// Provenance schema
export const ProvenanceSchema = z.object({
  created_by: z.string().min(1, "Created by cannot be empty"),
  source: z.string().min(1, "Source cannot be empty"),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional(),
});

// Artifacts schema
export const ArtifactsSchema = z.object({
  files: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
});

// Node status enum
export const NodeStatusSchema = z.enum([
  "ready",
  "running",
  "completed",
  "failed",
  "skipped",
  "blocked",
]);

// Node schema with all required fields
export const NodeSchema = z.object({
  id: IdSchema,
  kind: z.string().min(1, "Kind cannot be empty"),
  summary: z.string().min(1, "Summary cannot be empty"),
  prompt_text: z.string().min(1, "Prompt text cannot be empty"),
  parent: IdSchema.optional(),
  children: z.array(IdSchema).default([]),
  requires: z.array(z.string()).default([]),
  produces: z.array(z.string()).default([]),
  exec_target: z.string().optional(),
  embedding_ref: EmbeddingRefSchema.optional(),
  tags: z.array(z.string()).default([]),
  success_criteria: z.array(z.string()).default([]),
  guards: z.array(z.string()).default([]),
  artifacts: ArtifactsSchema.default(() => ({
    files: [],
    outputs: [],
    dependencies: [],
  })),
  status: NodeStatusSchema.default("ready"),
  provenance: ProvenanceSchema,
  version: VersionSchema.default(1),
  created_at: TimestampSchema.default(() => new Date().toISOString()),
  updated_at: TimestampSchema.default(() => new Date().toISOString()),
});

// Edge type enum
export const EdgeTypeSchema = z.enum([
  "hard_requires",
  "soft_semantic",
  "soft_order",
  "derived_from",
]);

// Edge schema with all required fields
export const EdgeSchema = z
  .object({
    src: IdSchema,
    dst: IdSchema,
    type: EdgeTypeSchema,
    score: z.number().min(0).max(1).optional(),
    evidence: z.string().optional(),
    provenance: ProvenanceSchema,
    version: VersionSchema.default(1),
    created_at: TimestampSchema.default(() => new Date().toISOString()),
    updated_at: TimestampSchema.default(() => new Date().toISOString()),
  })
  .refine((edge) => edge.src !== edge.dst, {
    message: "Edge source and destination cannot be the same",
  });

// Run schema
export const RunSchema = z.object({
  id: IdSchema,
  goal: z.string().min(1, "Goal cannot be empty"),
  nodes: z.array(IdSchema).min(1, "Run must contain at least one node"),
  ordering_reason: z.string().min(1, "Ordering reason cannot be empty"),
  created_at: TimestampSchema.default(() => new Date().toISOString()),
  status: z
    .enum(["planned", "running", "completed", "failed", "cancelled"])
    .default("planned"),
  provenance: ProvenanceSchema,
});

// Graph schema (collection of nodes and edges)
export const GraphSchema = z.object({
  nodes: z.array(NodeSchema).default([]),
  edges: z.array(EdgeSchema).default([]),
  version: VersionSchema.default(1),
  updated: TimestampSchema.default(() => new Date().toISOString()),
});

// Meta schema
export const MetaSchema = z.object({
  version: z.string().min(1, "Version cannot be empty"),
  created: TimestampSchema,
  updated: TimestampSchema,
  workspace_path: z.string().min(1, "Workspace path cannot be empty"),
});

// Journal event types
export const JournalEventTypeSchema = z.enum([
  "workspace_initialized",
  "add_node",
  "add_edge",
  "update_node",
  "update_edge",
  "start_run",
  "finish_run",
]);

// Journal event data schemas
export const AddNodeEventDataSchema = z.object({
  node: NodeSchema,
});

export const AddEdgeEventDataSchema = z.object({
  edge: EdgeSchema,
});

export const UpdateNodeEventDataSchema = z.object({
  node_id: IdSchema,
  node: NodeSchema,
});

export const UpdateEdgeEventDataSchema = z.object({
  edge_src: IdSchema,
  edge_dst: IdSchema,
  edge: EdgeSchema,
});

export const StartRunEventDataSchema = z.object({
  run: RunSchema,
});

export const FinishRunEventDataSchema = z.object({
  run_id: IdSchema,
  status: z.enum(["completed", "failed", "cancelled"]),
  result: z.string().optional(),
});

// Generic journal entry schema
export const JournalEntrySchema = z.object({
  timestamp: TimestampSchema,
  event: JournalEventTypeSchema,
  data: z.record(z.string(), z.unknown()).default({}),
  id: IdSchema,
});

// Typed journal entry schemas for specific events
export const AddNodeJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("add_node"),
  data: AddNodeEventDataSchema,
});

export const AddEdgeJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("add_edge"),
  data: AddEdgeEventDataSchema,
});

export const UpdateNodeJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("update_node"),
  data: UpdateNodeEventDataSchema,
});

export const UpdateEdgeJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("update_edge"),
  data: UpdateEdgeEventDataSchema,
});

export const StartRunJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("start_run"),
  data: StartRunEventDataSchema,
});

export const FinishRunJournalEntrySchema = JournalEntrySchema.extend({
  event: z.literal("finish_run"),
  data: FinishRunEventDataSchema,
});

// Type exports (inferred from schemas)
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type EmbeddingRef = z.infer<typeof EmbeddingRefSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type Artifacts = z.infer<typeof ArtifactsSchema>;
export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;

// Raw types for API compatibility
export type RawNode = Node;
export type RawEdge = Edge;
export type GraphPayload = Graph;

// Journal event type exports
export type JournalEventType = z.infer<typeof JournalEventTypeSchema>;
export type AddNodeEventData = z.infer<typeof AddNodeEventDataSchema>;
export type AddEdgeEventData = z.infer<typeof AddEdgeEventDataSchema>;
export type UpdateNodeEventData = z.infer<typeof UpdateNodeEventDataSchema>;
export type UpdateEdgeEventData = z.infer<typeof UpdateEdgeEventDataSchema>;
export type StartRunEventData = z.infer<typeof StartRunEventDataSchema>;
export type FinishRunEventData = z.infer<typeof FinishRunEventDataSchema>;

export type AddNodeJournalEntry = z.infer<typeof AddNodeJournalEntrySchema>;
export type AddEdgeJournalEntry = z.infer<typeof AddEdgeJournalEntrySchema>;
export type UpdateNodeJournalEntry = z.infer<
  typeof UpdateNodeJournalEntrySchema
>;
export type UpdateEdgeJournalEntry = z.infer<
  typeof UpdateEdgeJournalEntrySchema
>;
export type StartRunJournalEntry = z.infer<typeof StartRunJournalEntrySchema>;
export type FinishRunJournalEntry = z.infer<typeof FinishRunJournalEntrySchema>;

// Validation helper functions
export const validateNode = (data: unknown): Node => {
  return NodeSchema.parse(data);
};

export const validateEdge = (data: unknown): Edge => {
  return EdgeSchema.parse(data);
};

export const validateGraph = (data: unknown): Graph => {
  return GraphSchema.parse(data);
};

export const validateMeta = (data: unknown): Meta => {
  return MetaSchema.parse(data);
};

export const validateJournalEntry = (data: unknown): JournalEntry => {
  return JournalEntrySchema.parse(data);
};

export const validateRun = (data: unknown): Run => {
  return RunSchema.parse(data);
};

// Safe parsing functions that return results instead of throwing
export const safeParseNode = (data: unknown) => {
  return NodeSchema.safeParse(data);
};

export const safeParseEdge = (data: unknown) => {
  return EdgeSchema.safeParse(data);
};

export const safeParseGraph = (data: unknown) => {
  return GraphSchema.safeParse(data);
};

export const safeParseRun = (data: unknown) => {
  return RunSchema.safeParse(data);
};

// Validation error formatter
export const formatValidationError = (error: z.ZodError): string => {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });

  return `Validation failed:\n  - ${issues.join("\n  - ")}`;
};
