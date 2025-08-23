import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeDrawer from './NodeDrawer';
import { GoTNNode, GoTNEdge, GoTNGraph } from './types';
import { transformGraphData } from './utils';
import './App.css';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GoTNNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, hardEdges: 0, softEdges: 0 });

  const loadGraph = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/graph');
      const graphData: GoTNGraph = await response.json();
      
      const { nodes: flowNodes, edges: flowEdges } = transformGraphData(graphData);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      // Update stats
      const hardEdges = graphData.edges.filter(e => e.type === 'hard_requires').length;
      const softEdges = graphData.edges.filter(e => e.type === 'soft_semantic').length;
      
      setStats({
        nodes: graphData.nodes.length,
        edges: graphData.edges.length,
        hardEdges,
        softEdges
      });
      
      console.log(`📊 Loaded graph: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
    } catch (error) {
      console.error('❌ Failed to load graph:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const gotnNode = (node.data as any).originalNode as GoTNNode;
    setSelectedNode(gotnNode);
    setIsDrawerOpen(true);
  }, []);

  const filteredNodes = nodes.filter(node => 
    filter === '' || 
    node.data.label.toLowerCase().includes(filter.toLowerCase()) ||
    (node.data.originalNode?.tags || []).some((tag: string) => 
      tag.toLowerCase().includes(filter.toLowerCase())
    )
  );

  const filteredEdges = edges.filter(edge => {
    const sourceVisible = filteredNodes.some(n => n.id === edge.source);
    const targetVisible = filteredNodes.some(n => n.id === edge.target);
    return sourceVisible && targetVisible;
  });

  return (
    <div className="app">
      <ReactFlowProvider>
        <div className="flow-container">
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Panel position="top-left" className="controls-panel">
              <div className="controls-row">
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-input"
                />
                <button 
                  onClick={loadGraph} 
                  disabled={isLoading}
                  className="reload-button"
                >
                  {isLoading ? 'Loading...' : 'Reload'}
                </button>
              </div>
              
              <div className="stats">
                <span className="stat">Nodes: {stats.nodes}</span>
                <span className="stat">Edges: {stats.edges}</span>
                <span className="stat">Hard: {stats.hardEdges}</span>
                <span className="stat">Soft: {stats.softEdges}</span>
              </div>
              
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-line solid"></div>
                  <span>Hard dependencies</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line dashed"></div>
                  <span>Semantic similarity</span>
                </div>
              </div>
            </Panel>

            <Controls position="bottom-left" />
            <Background variant="dots" gap={20} size={1} color="#e5e5e5" />
          </ReactFlow>
        </div>
      </ReactFlowProvider>

      <NodeDrawer
        node={selectedNode}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

export default App;
