import React from "react";
import { RawNode } from "../types";

interface NodeModalProps {
  node: RawNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NodeModal({ node, isOpen, onClose }: NodeModalProps) {
  if (!isOpen || !node) return null;

  // Format JSON with special handling for prompt_text
  const formatJSON = (obj: any): JSX.Element => {
    const formatValue = (
      key: string,
      value: any,
      depth: number = 0
    ): JSX.Element => {
      const indent = "  ".repeat(depth);

      if (value === null) return <span className="json-null">null</span>;
      if (typeof value === "boolean")
        return <span className="json-boolean">{String(value)}</span>;
      if (typeof value === "number")
        return <span className="json-number">{value}</span>;
      if (typeof value === "string") {
        const isPromptText = key === "prompt_text";
        return (
          <span
            className={`json-string ${isPromptText ? "json-prompt-text" : ""}`}
          >
            "{value}"
          </span>
        );
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return <span>[]</span>;
        return (
          <div>
            [
            {value.map((item, index) => (
              <div key={index} style={{ marginLeft: "20px" }}>
                {formatValue("", item, depth + 1)}
                {index < value.length - 1 ? "," : ""}
              </div>
            ))}
            ]
          </div>
        );
      }

      if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return <span>{"{}"}</span>;

        return (
          <div>
            {"{"}
            {entries.map(([k, v], index) => (
              <div key={k} style={{ marginLeft: "20px" }}>
                <span className="json-key">"{k}"</span>:{" "}
                {formatValue(k, v, depth + 1)}
                {index < entries.length - 1 ? "," : ""}
              </div>
            ))}
            {"}"}
          </div>
        );
      }

      return <span>{String(value)}</span>;
    };

    return formatValue("", obj);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{node.summary || node.id}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="json-container">
            <pre className="json-display">{formatJSON(node)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
