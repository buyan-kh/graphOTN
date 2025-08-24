import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string) => void;
  onFitView: () => void;
}

function GraphViewInner({
  nodes,
  edges,
  onNodeClick,
  onFitView,
}: GraphViewProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);
  const { fitView } = useReactFlow();

  // Update nodes and edges when props change
  useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);

  useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  // Fit view on initial load and when requested
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      fitView({
        nodes: [node],
        duration: 500,
        padding: 0.3,
      });
    },
    [fitView]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          fitView({ padding: 0.1 });
          onFitView();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fitView, onFitView]);

  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <h2>No data</h2>
        <p>No nodes to display. Try reloading or check your graph data.</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={reactFlowNodes}
      edges={reactFlowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultEdgeOptions={{
        type: "default",
        animated: false,
      }}
    >
      <Background />
      <Controls
        showInteractive={false}
        style={{
          bottom: "20px",
          left: "20px",
        }}
      />
    </ReactFlow>
  );
}

export function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
}
