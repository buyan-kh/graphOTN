import React from "react";

interface FooterProps {
  totalNodes: number;
  totalEdges: number;
  visibleNodes: number;
  visibleEdges: number;
}

export function Footer({
  totalNodes,
  totalEdges,
  visibleNodes,
  visibleEdges,
}: FooterProps) {
  return (
    <footer className="footer">
      <div>
        {totalNodes} nodes, {totalEdges} edges
      </div>
      <div>
        visible: {visibleNodes}/{totalNodes} nodes • {visibleEdges}/{totalEdges}{" "}
        edges
      </div>
    </footer>
  );
}
