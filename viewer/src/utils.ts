import { Node, Edge } from 'reactflow';
import { GoTNNode, GoTNEdge, GoTNGraph } from './types';

export function transformGraphData(graph: GoTNGraph): { nodes: Node[], edges: Edge[] } {
  // Transform nodes
  const nodes: Node[] = graph.nodes.map((node: GoTNNode, index: number) => ({
    id: node.id,
    type: 'default',
    position: calculateNodePosition(node, index, graph.nodes),
    data: {
      label: node.summary,
      originalNode: node
    },
    style: {
      background: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#000000',
      minWidth: '120px',
      textAlign: 'center'
    }
  }));

  // Transform edges
  const edges: Edge[] = graph.edges.map((edge: GoTNEdge) => {
    let className = '';
    let style: any = {};
    
    switch (edge.type) {
      case 'hard_requires':
        className = 'hard-edge';
        style = { stroke: '#000000', strokeWidth: 2 };
        break;
      case 'soft_semantic':
        className = 'soft-edge';
        style = { stroke: '#666666', strokeWidth: 1, strokeDasharray: '5,5' };
        break;
      case 'derived_from':
        className = 'derived-edge';
        style = { stroke: '#999999', strokeWidth: 1 };
        break;
    }

    return {
      id: `${edge.src}-${edge.dst}-${edge.type}`,
      source: edge.src,
      target: edge.dst,
      type: 'default',
      className,
      style,
      label: edge.type === 'soft_semantic' && edge.score 
        ? `${edge.score.toFixed(3)}` 
        : undefined,
      labelStyle: { fontSize: '10px', color: '#666666' }
    };
  });

  return { nodes, edges };
}

function calculateNodePosition(node: GoTNNode, index: number, allNodes: GoTNNode[]): { x: number, y: number } {
  // Simple hierarchical layout based on node relationships
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const levels = new Map<string, number>();
  
  // Calculate depth for each node
  function calculateDepth(nodeId: string, depth = 0): number {
    if (visited.has(nodeId)) {
      return levels.get(nodeId) || 0;
    }
    
    visited.add(nodeId);
    const currentNode = nodeMap.get(nodeId);
    
    if (!currentNode || !currentNode.parent) {
      levels.set(nodeId, depth);
      return depth;
    }
    
    const parentDepth = calculateDepth(currentNode.parent, depth + 1);
    const nodeDepth = parentDepth + 1;
    levels.set(nodeId, nodeDepth);
    return nodeDepth;
  }
  
  // Calculate depth for all nodes
  allNodes.forEach(n => calculateDepth(n.id));
  
  const nodeDepth = levels.get(node.id) || 0;
  const nodesAtLevel = allNodes.filter(n => levels.get(n.id) === nodeDepth);
  const indexAtLevel = nodesAtLevel.findIndex(n => n.id === node.id);
  
  // Layout parameters
  const levelHeight = 120;
  const nodeSpacing = 180;
  const startX = -(nodesAtLevel.length - 1) * nodeSpacing / 2;
  
  return {
    x: startX + indexAtLevel * nodeSpacing,
    y: nodeDepth * levelHeight
  };
}
