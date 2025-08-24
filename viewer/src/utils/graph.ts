import { Node, Edge } from "reactflow";
import { RawNode, RawEdge, NodePosition } from "../types";

export function filterIds(nodes: RawNode[], query: string): Set<string> {
  if (!query.trim()) {
    return new Set(nodes.map((n) => n.id));
  }

  const lowerQuery = query.toLowerCase();
  const matchingIds = new Set<string>();

  for (const node of nodes) {
    const matchesId = node.id.toLowerCase().includes(lowerQuery);
    const matchesSummary = node.summary?.toLowerCase().includes(lowerQuery);

    if (matchesId || matchesSummary) {
      matchingIds.add(node.id);
    }
  }

  return matchingIds;
}

export function mapToReactFlow(
  nodes: RawNode[],
  edges: RawEdge[],
  positions: Record<string, NodePosition>,
  filteredIds: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  // Map nodes
  const reactFlowNodes: Node[] = nodes
    .filter((node) => filteredIds.has(node.id))
    .map((node, index) => ({
      id: node.id,
      type: "default",
      position: positions[node.id] || { x: index * 200, y: index * 100 },
      data: {
        label: node.summary || node.id,
        originalNode: node,
      },
      draggable: false,
    }));

  // Map edges - only include if both source and target are visible
  const reactFlowEdges: Edge[] = edges
    .filter((edge) => filteredIds.has(edge.src) && filteredIds.has(edge.dst))
    .map((edge) => {
      const edgeId = `${edge.src}->${edge.dst}`;
      let className = "";
      let animated = false;

      // Determine edge styling based on type
      switch (edge.type) {
        case "hard_requires":
        case "derived_from":
          className = "hard-edge";
          break;
        case "soft_semantic":
        case "soft_order":
          className = "soft-edge";
          break;
        default:
          // Default to hard edge if no type specified
          className = "hard-edge";
          break;
      }

      return {
        id: edgeId,
        source: edge.src,
        target: edge.dst,
        type: "default",
        className,
        animated,
        label:
          edge.type === "soft_semantic" && edge.score
            ? edge.score.toFixed(3)
            : undefined,
        labelStyle: { fontSize: "10px" },
      };
    });

  return { nodes: reactFlowNodes, edges: reactFlowEdges };
}

export function getEdgeCounts(edges: RawEdge[]): {
  hard: number;
  soft: number;
} {
  let hard = 0;
  let soft = 0;

  for (const edge of edges) {
    if (edge.type === "soft_semantic" || edge.type === "soft_order") {
      soft++;
    } else {
      hard++;
    }
  }

  return { hard, soft };
}

export function exportGraphAsJson(graph: any): void {
  const dataStr = JSON.stringify(graph, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "graph.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
