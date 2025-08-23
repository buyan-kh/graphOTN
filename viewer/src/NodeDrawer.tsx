import React from 'react';
import { GoTNNode } from './types';
import './NodeDrawer.css';

interface NodeDrawerProps {
  node: GoTNNode | null;
  isOpen: boolean;
  onClose: () => void;
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({ node, isOpen, onClose }) => {
  if (!isOpen || !node) return null;

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Node Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="drawer-content">
          <div className="node-summary">
            <h3>{node.summary}</h3>
            <div className="node-meta">
              <span className="node-id">ID: {node.id}</span>
              <span className="node-status status-{node.status}">{node.status}</span>
            </div>
          </div>

          <div className="node-section">
            <h4>Description</h4>
            <p>{node.prompt_text}</p>
          </div>

          <div className="node-section">
            <h4>Dependencies</h4>
            <div className="dependency-lists">
              <div>
                <strong>Requires:</strong>
                {node.requires.length > 0 ? (
                  <ul>
                    {node.requires.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="empty">None</span>
                )}
              </div>
              <div>
                <strong>Produces:</strong>
                {node.produces.length > 0 ? (
                  <ul>
                    {node.produces.map((prod, i) => (
                      <li key={i}>{prod}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="empty">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="node-section">
            <h4>Tags</h4>
            <div className="tags">
              {node.tags.length > 0 ? (
                node.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))
              ) : (
                <span className="empty">None</span>
              )}
            </div>
          </div>

          <div className="node-section">
            <h4>Success Criteria</h4>
            {node.success_criteria.length > 0 ? (
              <ul>
                {node.success_criteria.map((criteria, i) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            ) : (
              <span className="empty">None</span>
            )}
          </div>

          <div className="node-section">
            <h4>Guards</h4>
            {node.guards.length > 0 ? (
              <ul>
                {node.guards.map((guard, i) => (
                  <li key={i}>{guard}</li>
                ))}
              </ul>
            ) : (
              <span className="empty">None</span>
            )}
          </div>

          <div className="node-section">
            <h4>Raw JSON</h4>
            <pre className="json-display">{formatJson(node)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDrawer;
