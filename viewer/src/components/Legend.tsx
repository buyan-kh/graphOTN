import React from "react";
import { RawEdge } from "../types";
import { getEdgeCounts } from "../utils/graph";

interface LegendProps {
  show: boolean;
  totalNodes: number;
  visibleNodes: number;
  edges: RawEdge[];
  visibleEdges: number;
}

export function Legend({
  show,
  totalNodes,
  visibleNodes,
  edges,
  visibleEdges,
}: LegendProps) {
  if (!show) return null;

  const { hard, soft } = getEdgeCounts(edges);

  return (
    <div className="legend" role="complementary" aria-label="Graph legend">
      <div className="legend-title">Legend</div>

      <div className="legend-item">
        <div className="legend-line" aria-hidden="true"></div>
        <span>Hard edges (dependencies)</span>
      </div>

      <div className="legend-item">
        <div className="legend-line dashed" aria-hidden="true"></div>
        <span>Soft edges (similarity)</span>
      </div>

      <div className="legend-counts">
        <div>
          Nodes: {visibleNodes}/{totalNodes}
        </div>
        <div>
          Edges: {visibleEdges}/{edges.length}
        </div>
        <div>
          Hard: {hard} • Soft: {soft}
        </div>
      </div>
    </div>
  );
}
