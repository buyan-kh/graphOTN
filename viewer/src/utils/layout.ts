import {
  RawNode,
  RawEdge,
  LayoutMode,
  LayoutResult,
  NodePosition,
} from "../types";

export function computeLayout(
  nodes: RawNode[],
  edges: RawEdge[],
  mode: LayoutMode = "TD"
): LayoutResult {
  const { layers, hasCycle } = topoSortHardEdges(nodes, edges);
  const positions = positionsFromLayers(layers, mode);

  return { positions, layers, hasCycle };
}

export function topoSortHardEdges(
  nodes: RawNode[],
  edges: RawEdge[]
): { layers: string[][]; hasCycle: boolean } {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const hardEdges = edges.filter(
    (e) => !e.type || e.type === "hard_requires" || e.type === "derived_from"
  );

  // Build adjacency list and in-degree count
  const adjList = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const nodeId of nodeIds) {
    adjList.set(nodeId, new Set());
    inDegree.set(nodeId, 0);
  }

  // Add edges
  for (const edge of hardEdges) {
    if (nodeIds.has(edge.src) && nodeIds.has(edge.dst)) {
      adjList.get(edge.src)!.add(edge.dst);
      inDegree.set(edge.dst, inDegree.get(edge.dst)! + 1);
    }
  }

  // Kahn's algorithm
  const layers: string[][] = [];
  const visited = new Set<string>();

  while (visited.size < nodeIds.size) {
    // Find nodes with in-degree 0
    const currentLayer: string[] = [];

    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0 && !visited.has(nodeId)) {
        currentLayer.push(nodeId);
      }
    }

    if (currentLayer.length === 0) {
      // Cycle detected - add remaining nodes to fallback layer
      const remaining = Array.from(nodeIds).filter((id) => !visited.has(id));
      if (remaining.length > 0) {
        layers.push(remaining);
        remaining.forEach((id) => visited.add(id));
      }
      return { layers, hasCycle: true };
    }

    layers.push(currentLayer);

    // Update in-degrees for next iteration
    for (const nodeId of currentLayer) {
      visited.add(nodeId);
      inDegree.set(nodeId, -1); // Mark as processed

      for (const neighbor of adjList.get(nodeId)!) {
        if (!visited.has(neighbor)) {
          inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        }
      }
    }
  }

  return { layers, hasCycle: false };
}

export function positionsFromLayers(
  layers: string[][],
  mode: LayoutMode
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const nodeSpacing = mode === "TD" ? 280 : 140;
  const layerSpacing = mode === "TD" ? 140 : 280;

  layers.forEach((layer, layerIndex) => {
    const layerWidth = (layer.length - 1) * nodeSpacing;
    const startX = -layerWidth / 2;

    layer.forEach((nodeId, nodeIndex) => {
      const x = startX + nodeIndex * nodeSpacing;
      const y = layerIndex * layerSpacing;

      positions[nodeId] = mode === "TD" ? { x, y } : { x: y, y: x }; // Swap for left-right layout
    });
  });

  return positions;
}

export function detectCycles(nodes: RawNode[], edges: RawEdge[]): boolean {
  const { hasCycle } = topoSortHardEdges(nodes, edges);
  return hasCycle;
}
