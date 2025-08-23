/**
 * PlanComposer - Creates safe execution plans from dependency graphs
 */
import { readGraph } from "./fsStore.js";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
export class PlanComposer {
    constructor() { }
    /**
     * Topological sort with cycle detection
     */
    async topologicalSort(nodes, hardEdges) {
        const nodeIds = new Set(nodes.map((n) => n.id));
        const inDegree = new Map();
        const adjList = new Map();
        const softScores = new Map();
        // Initialize
        for (const node of nodes) {
            inDegree.set(node.id, 0);
            adjList.set(node.id, []);
            softScores.set(node.id, 0);
        }
        // Build adjacency list from hard edges only
        for (const edge of hardEdges) {
            if (nodeIds.has(edge.src) && nodeIds.has(edge.dst)) {
                adjList.get(edge.src).push(edge.dst);
                inDegree.set(edge.dst, inDegree.get(edge.dst) + 1);
            }
        }
        // Calculate soft scores (sum of incoming soft edge scores)
        const graph = await readGraph(".");
        const softEdges = graph.edges.filter((e) => e.type === "soft_semantic");
        for (const edge of softEdges) {
            if (nodeIds.has(edge.dst)) {
                const currentScore = softScores.get(edge.dst) || 0;
                softScores.set(edge.dst, currentScore + (edge.score || 0));
            }
        }
        const layers = [];
        const queue = [];
        const processed = new Set();
        // Find nodes with no incoming edges
        for (const [nodeId, degree] of inDegree) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }
        while (queue.length > 0) {
            // Sort current layer by soft scores (descending)
            queue.sort((a, b) => (softScores.get(b) || 0) - (softScores.get(a) || 0));
            const currentLayer = [...queue];
            layers.push(currentLayer);
            queue.length = 0;
            for (const nodeId of currentLayer) {
                processed.add(nodeId);
                // Reduce in-degree of neighbors
                for (const neighbor of adjList.get(nodeId) || []) {
                    const newDegree = inDegree.get(neighbor) - 1;
                    inDegree.set(neighbor, newDegree);
                    if (newDegree === 0) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        // Check for cycles
        const hasCycle = processed.size !== nodes.length;
        return { layers, hasCycle };
    }
    /**
     * Filter nodes based on goal criteria
     */
    filterNodes(nodes, request) {
        if (!request.requires && !request.produces) {
            return nodes; // Return all nodes if no filter criteria
        }
        const filtered = nodes.filter((node) => {
            // Include if node requires any of the specified tags
            if (request.requires) {
                const hasRequiredTag = request.requires.some((tag) => node.requires.includes(tag));
                if (hasRequiredTag)
                    return true;
            }
            // Include if node produces any of the specified tags
            if (request.produces) {
                const hasProducedTag = request.produces.some((tag) => node.produces.includes(tag));
                if (hasProducedTag)
                    return true;
            }
            return false;
        });
        return filtered;
    }
    /**
     * Create execution plan
     */
    async composePlan(request) {
        const graph = await readGraph(".");
        // Filter nodes based on goal
        const targetNodes = this.filterNodes(graph.nodes, request);
        if (targetNodes.length === 0) {
            throw new Error("No nodes match the specified criteria");
        }
        // Get hard edges only
        const hardEdges = graph.edges.filter((e) => e.type === "hard_requires");
        // Perform topological sort
        const { layers, hasCycle } = await this.topologicalSort(targetNodes, hardEdges);
        if (hasCycle) {
            throw new Error("Cycle detected in hard dependency edges - cannot create safe plan");
        }
        // Flatten layers to get ordered node IDs
        const orderedNodeIds = layers.flat();
        // Create run folder
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const runFolder = path.join(".gotn", "runs", `run-${timestamp}`);
        if (!existsSync(runFolder)) {
            await mkdir(runFolder, { recursive: true });
        }
        // Create reason text
        const reason = `Topological sort of ${targetNodes.length} nodes across ${layers.length} layers. ` +
            `Dependencies resolved through ${hardEdges.length} hard edges. ` +
            `Nodes ordered by dependency requirements with soft score tie-breaking within layers.`;
        // Write plan.json
        const planData = {
            goal: request.goal || "Execute filtered nodes",
            created_at: new Date().toISOString(),
            total_nodes: orderedNodeIds.length,
            layers: layers.length,
            ordered_node_ids: orderedNodeIds,
            layers_detail: layers.map((layer, i) => ({
                layer: i,
                nodes: layer,
                count: layer.length,
            })),
            reason,
            criteria: {
                requires: request.requires || [],
                produces: request.produces || [],
            },
        };
        await writeFile(path.join(runFolder, "plan.json"), JSON.stringify(planData, null, 2));
        // Create empty steps.jsonl
        await writeFile(path.join(runFolder, "steps.jsonl"), "");
        console.log(`Plan created with ${orderedNodeIds.length} nodes in ${layers.length} layers`);
        return {
            ordered_node_ids: orderedNodeIds,
            reason,
            run_folder: runFolder,
            layers,
        };
    }
}
let defaultPlanComposer = null;
export function getPlanComposer() {
    if (!defaultPlanComposer) {
        defaultPlanComposer = new PlanComposer();
    }
    return defaultPlanComposer;
}
