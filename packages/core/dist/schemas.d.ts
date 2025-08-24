/**
 * GoTN Zod Schemas for Validation
 *
 * Defines strict validation schemas for all data structures
 * to ensure type safety and data integrity.
 */
import { z } from "zod";
export declare const IdSchema: z.ZodString;
export declare const TimestampSchema: z.ZodString;
export declare const VersionSchema: z.ZodNumber;
export declare const EmbeddingRefSchema: z.ZodObject<{
    collection: z.ZodString;
    id: z.ZodString;
}, z.core.$strip>;
export declare const ProvenanceSchema: z.ZodObject<{
    created_by: z.ZodString;
    source: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ArtifactsSchema: z.ZodObject<{
    files: z.ZodDefault<z.ZodArray<z.ZodString>>;
    outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const NodeStatusSchema: z.ZodEnum<{
    ready: "ready";
    running: "running";
    completed: "completed";
    failed: "failed";
    skipped: "skipped";
    blocked: "blocked";
}>;
export declare const NodeSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodString;
    summary: z.ZodString;
    prompt_text: z.ZodString;
    parent: z.ZodOptional<z.ZodString>;
    children: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
    produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
    exec_target: z.ZodOptional<z.ZodString>;
    embedding_ref: z.ZodOptional<z.ZodObject<{
        collection: z.ZodString;
        id: z.ZodString;
    }, z.core.$strip>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
    guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
    artifacts: z.ZodDefault<z.ZodObject<{
        files: z.ZodDefault<z.ZodArray<z.ZodString>>;
        outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    status: z.ZodDefault<z.ZodEnum<{
        ready: "ready";
        running: "running";
        completed: "completed";
        failed: "failed";
        skipped: "skipped";
        blocked: "blocked";
    }>>;
    provenance: z.ZodObject<{
        created_by: z.ZodString;
        source: z.ZodString;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    version: z.ZodDefault<z.ZodNumber>;
    created_at: z.ZodDefault<z.ZodString>;
    updated_at: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const EdgeTypeSchema: z.ZodEnum<{
    hard_requires: "hard_requires";
    soft_semantic: "soft_semantic";
    soft_order: "soft_order";
    derived_from: "derived_from";
}>;
export declare const EdgeSchema: z.ZodObject<{
    src: z.ZodString;
    dst: z.ZodString;
    type: z.ZodEnum<{
        hard_requires: "hard_requires";
        soft_semantic: "soft_semantic";
        soft_order: "soft_order";
        derived_from: "derived_from";
    }>;
    score: z.ZodOptional<z.ZodNumber>;
    evidence: z.ZodOptional<z.ZodString>;
    provenance: z.ZodObject<{
        created_by: z.ZodString;
        source: z.ZodString;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    version: z.ZodDefault<z.ZodNumber>;
    created_at: z.ZodDefault<z.ZodString>;
    updated_at: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const RunSchema: z.ZodObject<{
    id: z.ZodString;
    goal: z.ZodString;
    nodes: z.ZodArray<z.ZodString>;
    ordering_reason: z.ZodString;
    created_at: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        running: "running";
        completed: "completed";
        failed: "failed";
        planned: "planned";
        cancelled: "cancelled";
    }>>;
    provenance: z.ZodObject<{
        created_by: z.ZodString;
        source: z.ZodString;
        created_at: z.ZodOptional<z.ZodString>;
        updated_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GraphSchema: z.ZodObject<{
    nodes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodString;
        summary: z.ZodString;
        prompt_text: z.ZodString;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodDefault<z.ZodArray<z.ZodString>>;
        requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
        produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
        exec_target: z.ZodOptional<z.ZodString>;
        embedding_ref: z.ZodOptional<z.ZodObject<{
            collection: z.ZodString;
            id: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
        success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodObject<{
            files: z.ZodDefault<z.ZodArray<z.ZodString>>;
            outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        status: z.ZodDefault<z.ZodEnum<{
            ready: "ready";
            running: "running";
            completed: "completed";
            failed: "failed";
            skipped: "skipped";
            blocked: "blocked";
        }>>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    edges: z.ZodDefault<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        dst: z.ZodString;
        type: z.ZodEnum<{
            hard_requires: "hard_requires";
            soft_semantic: "soft_semantic";
            soft_order: "soft_order";
            derived_from: "derived_from";
        }>;
        score: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodString>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    version: z.ZodDefault<z.ZodNumber>;
    updated: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const MetaSchema: z.ZodObject<{
    version: z.ZodString;
    created: z.ZodString;
    updated: z.ZodString;
    workspace_path: z.ZodString;
}, z.core.$strip>;
export declare const JournalEventTypeSchema: z.ZodEnum<{
    workspace_initialized: "workspace_initialized";
    add_node: "add_node";
    add_edge: "add_edge";
    update_node: "update_node";
    update_edge: "update_edge";
    start_run: "start_run";
    finish_run: "finish_run";
}>;
export declare const AddNodeEventDataSchema: z.ZodObject<{
    node: z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodString;
        summary: z.ZodString;
        prompt_text: z.ZodString;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodDefault<z.ZodArray<z.ZodString>>;
        requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
        produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
        exec_target: z.ZodOptional<z.ZodString>;
        embedding_ref: z.ZodOptional<z.ZodObject<{
            collection: z.ZodString;
            id: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
        success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodObject<{
            files: z.ZodDefault<z.ZodArray<z.ZodString>>;
            outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        status: z.ZodDefault<z.ZodEnum<{
            ready: "ready";
            running: "running";
            completed: "completed";
            failed: "failed";
            skipped: "skipped";
            blocked: "blocked";
        }>>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const AddEdgeEventDataSchema: z.ZodObject<{
    edge: z.ZodObject<{
        src: z.ZodString;
        dst: z.ZodString;
        type: z.ZodEnum<{
            hard_requires: "hard_requires";
            soft_semantic: "soft_semantic";
            soft_order: "soft_order";
            derived_from: "derived_from";
        }>;
        score: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodString>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateNodeEventDataSchema: z.ZodObject<{
    node_id: z.ZodString;
    node: z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodString;
        summary: z.ZodString;
        prompt_text: z.ZodString;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodDefault<z.ZodArray<z.ZodString>>;
        requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
        produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
        exec_target: z.ZodOptional<z.ZodString>;
        embedding_ref: z.ZodOptional<z.ZodObject<{
            collection: z.ZodString;
            id: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
        success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodObject<{
            files: z.ZodDefault<z.ZodArray<z.ZodString>>;
            outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        status: z.ZodDefault<z.ZodEnum<{
            ready: "ready";
            running: "running";
            completed: "completed";
            failed: "failed";
            skipped: "skipped";
            blocked: "blocked";
        }>>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateEdgeEventDataSchema: z.ZodObject<{
    edge_src: z.ZodString;
    edge_dst: z.ZodString;
    edge: z.ZodObject<{
        src: z.ZodString;
        dst: z.ZodString;
        type: z.ZodEnum<{
            hard_requires: "hard_requires";
            soft_semantic: "soft_semantic";
            soft_order: "soft_order";
            derived_from: "derived_from";
        }>;
        score: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodString>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        version: z.ZodDefault<z.ZodNumber>;
        created_at: z.ZodDefault<z.ZodString>;
        updated_at: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const StartRunEventDataSchema: z.ZodObject<{
    run: z.ZodObject<{
        id: z.ZodString;
        goal: z.ZodString;
        nodes: z.ZodArray<z.ZodString>;
        ordering_reason: z.ZodString;
        created_at: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            running: "running";
            completed: "completed";
            failed: "failed";
            planned: "planned";
            cancelled: "cancelled";
        }>>;
        provenance: z.ZodObject<{
            created_by: z.ZodString;
            source: z.ZodString;
            created_at: z.ZodOptional<z.ZodString>;
            updated_at: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const FinishRunEventDataSchema: z.ZodObject<{
    run_id: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
    }>;
    result: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const JournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    event: z.ZodEnum<{
        workspace_initialized: "workspace_initialized";
        add_node: "add_node";
        add_edge: "add_edge";
        update_node: "update_node";
        update_edge: "update_edge";
        start_run: "start_run";
        finish_run: "finish_run";
    }>;
    data: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    id: z.ZodString;
}, z.core.$strip>;
export declare const AddNodeJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"add_node">;
    data: z.ZodObject<{
        node: z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodString;
            summary: z.ZodString;
            prompt_text: z.ZodString;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodDefault<z.ZodArray<z.ZodString>>;
            requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
            produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
            exec_target: z.ZodOptional<z.ZodString>;
            embedding_ref: z.ZodOptional<z.ZodObject<{
                collection: z.ZodString;
                id: z.ZodString;
            }, z.core.$strip>>;
            tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
            success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
            guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
            artifacts: z.ZodDefault<z.ZodObject<{
                files: z.ZodDefault<z.ZodArray<z.ZodString>>;
                outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
                dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
            status: z.ZodDefault<z.ZodEnum<{
                ready: "ready";
                running: "running";
                completed: "completed";
                failed: "failed";
                skipped: "skipped";
                blocked: "blocked";
            }>>;
            provenance: z.ZodObject<{
                created_by: z.ZodString;
                source: z.ZodString;
                created_at: z.ZodOptional<z.ZodString>;
                updated_at: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            version: z.ZodDefault<z.ZodNumber>;
            created_at: z.ZodDefault<z.ZodString>;
            updated_at: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const AddEdgeJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"add_edge">;
    data: z.ZodObject<{
        edge: z.ZodObject<{
            src: z.ZodString;
            dst: z.ZodString;
            type: z.ZodEnum<{
                hard_requires: "hard_requires";
                soft_semantic: "soft_semantic";
                soft_order: "soft_order";
                derived_from: "derived_from";
            }>;
            score: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodString>;
            provenance: z.ZodObject<{
                created_by: z.ZodString;
                source: z.ZodString;
                created_at: z.ZodOptional<z.ZodString>;
                updated_at: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            version: z.ZodDefault<z.ZodNumber>;
            created_at: z.ZodDefault<z.ZodString>;
            updated_at: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateNodeJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"update_node">;
    data: z.ZodObject<{
        node_id: z.ZodString;
        node: z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodString;
            summary: z.ZodString;
            prompt_text: z.ZodString;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodDefault<z.ZodArray<z.ZodString>>;
            requires: z.ZodDefault<z.ZodArray<z.ZodString>>;
            produces: z.ZodDefault<z.ZodArray<z.ZodString>>;
            exec_target: z.ZodOptional<z.ZodString>;
            embedding_ref: z.ZodOptional<z.ZodObject<{
                collection: z.ZodString;
                id: z.ZodString;
            }, z.core.$strip>>;
            tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
            success_criteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
            guards: z.ZodDefault<z.ZodArray<z.ZodString>>;
            artifacts: z.ZodDefault<z.ZodObject<{
                files: z.ZodDefault<z.ZodArray<z.ZodString>>;
                outputs: z.ZodDefault<z.ZodArray<z.ZodString>>;
                dependencies: z.ZodDefault<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
            status: z.ZodDefault<z.ZodEnum<{
                ready: "ready";
                running: "running";
                completed: "completed";
                failed: "failed";
                skipped: "skipped";
                blocked: "blocked";
            }>>;
            provenance: z.ZodObject<{
                created_by: z.ZodString;
                source: z.ZodString;
                created_at: z.ZodOptional<z.ZodString>;
                updated_at: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            version: z.ZodDefault<z.ZodNumber>;
            created_at: z.ZodDefault<z.ZodString>;
            updated_at: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateEdgeJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"update_edge">;
    data: z.ZodObject<{
        edge_src: z.ZodString;
        edge_dst: z.ZodString;
        edge: z.ZodObject<{
            src: z.ZodString;
            dst: z.ZodString;
            type: z.ZodEnum<{
                hard_requires: "hard_requires";
                soft_semantic: "soft_semantic";
                soft_order: "soft_order";
                derived_from: "derived_from";
            }>;
            score: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodString>;
            provenance: z.ZodObject<{
                created_by: z.ZodString;
                source: z.ZodString;
                created_at: z.ZodOptional<z.ZodString>;
                updated_at: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            version: z.ZodDefault<z.ZodNumber>;
            created_at: z.ZodDefault<z.ZodString>;
            updated_at: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const StartRunJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"start_run">;
    data: z.ZodObject<{
        run: z.ZodObject<{
            id: z.ZodString;
            goal: z.ZodString;
            nodes: z.ZodArray<z.ZodString>;
            ordering_reason: z.ZodString;
            created_at: z.ZodDefault<z.ZodString>;
            status: z.ZodDefault<z.ZodEnum<{
                running: "running";
                completed: "completed";
                failed: "failed";
                planned: "planned";
                cancelled: "cancelled";
            }>>;
            provenance: z.ZodObject<{
                created_by: z.ZodString;
                source: z.ZodString;
                created_at: z.ZodOptional<z.ZodString>;
                updated_at: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const FinishRunJournalEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    id: z.ZodString;
    event: z.ZodLiteral<"finish_run">;
    data: z.ZodObject<{
        run_id: z.ZodString;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            cancelled: "cancelled";
        }>;
        result: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
export type RawNode = Node;
export type RawEdge = Edge;
export type GraphPayload = Graph;
export type JournalEventType = z.infer<typeof JournalEventTypeSchema>;
export type AddNodeEventData = z.infer<typeof AddNodeEventDataSchema>;
export type AddEdgeEventData = z.infer<typeof AddEdgeEventDataSchema>;
export type UpdateNodeEventData = z.infer<typeof UpdateNodeEventDataSchema>;
export type UpdateEdgeEventData = z.infer<typeof UpdateEdgeEventDataSchema>;
export type StartRunEventData = z.infer<typeof StartRunEventDataSchema>;
export type FinishRunEventData = z.infer<typeof FinishRunEventDataSchema>;
export type AddNodeJournalEntry = z.infer<typeof AddNodeJournalEntrySchema>;
export type AddEdgeJournalEntry = z.infer<typeof AddEdgeJournalEntrySchema>;
export type UpdateNodeJournalEntry = z.infer<typeof UpdateNodeJournalEntrySchema>;
export type UpdateEdgeJournalEntry = z.infer<typeof UpdateEdgeJournalEntrySchema>;
export type StartRunJournalEntry = z.infer<typeof StartRunJournalEntrySchema>;
export type FinishRunJournalEntry = z.infer<typeof FinishRunJournalEntrySchema>;
export declare const validateNode: (data: unknown) => Node;
export declare const validateEdge: (data: unknown) => Edge;
export declare const validateGraph: (data: unknown) => Graph;
export declare const validateMeta: (data: unknown) => Meta;
export declare const validateJournalEntry: (data: unknown) => JournalEntry;
export declare const validateRun: (data: unknown) => Run;
export declare const safeParseNode: (data: unknown) => z.ZodSafeParseResult<{
    id: string;
    kind: string;
    summary: string;
    prompt_text: string;
    children: string[];
    requires: string[];
    produces: string[];
    tags: string[];
    success_criteria: string[];
    guards: string[];
    artifacts: {
        files: string[];
        outputs: string[];
        dependencies: string[];
    };
    status: "ready" | "running" | "completed" | "failed" | "skipped" | "blocked";
    provenance: {
        created_by: string;
        source: string;
        created_at?: string | undefined;
        updated_at?: string | undefined;
    };
    version: number;
    created_at: string;
    updated_at: string;
    parent?: string | undefined;
    exec_target?: string | undefined;
    embedding_ref?: {
        collection: string;
        id: string;
    } | undefined;
}>;
export declare const safeParseEdge: (data: unknown) => z.ZodSafeParseResult<{
    src: string;
    dst: string;
    type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
    provenance: {
        created_by: string;
        source: string;
        created_at?: string | undefined;
        updated_at?: string | undefined;
    };
    version: number;
    created_at: string;
    updated_at: string;
    score?: number | undefined;
    evidence?: string | undefined;
}>;
export declare const safeParseGraph: (data: unknown) => z.ZodSafeParseResult<{
    nodes: {
        id: string;
        kind: string;
        summary: string;
        prompt_text: string;
        children: string[];
        requires: string[];
        produces: string[];
        tags: string[];
        success_criteria: string[];
        guards: string[];
        artifacts: {
            files: string[];
            outputs: string[];
            dependencies: string[];
        };
        status: "ready" | "running" | "completed" | "failed" | "skipped" | "blocked";
        provenance: {
            created_by: string;
            source: string;
            created_at?: string | undefined;
            updated_at?: string | undefined;
        };
        version: number;
        created_at: string;
        updated_at: string;
        parent?: string | undefined;
        exec_target?: string | undefined;
        embedding_ref?: {
            collection: string;
            id: string;
        } | undefined;
    }[];
    edges: {
        src: string;
        dst: string;
        type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
        provenance: {
            created_by: string;
            source: string;
            created_at?: string | undefined;
            updated_at?: string | undefined;
        };
        version: number;
        created_at: string;
        updated_at: string;
        score?: number | undefined;
        evidence?: string | undefined;
    }[];
    version: number;
    updated: string;
}>;
export declare const safeParseRun: (data: unknown) => z.ZodSafeParseResult<{
    id: string;
    goal: string;
    nodes: string[];
    ordering_reason: string;
    created_at: string;
    status: "running" | "completed" | "failed" | "planned" | "cancelled";
    provenance: {
        created_by: string;
        source: string;
        created_at?: string | undefined;
        updated_at?: string | undefined;
    };
}>;
export declare const formatValidationError: (error: z.ZodError) => string;
