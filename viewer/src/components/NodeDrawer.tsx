import React, { useEffect, useRef } from "react";
import { RawNode } from "../types";

interface NodeDrawerProps {
  node: RawNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NodeDrawer({ node, isOpen, onClose }: NodeDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCopyJson = () => {
    if (node) {
      copyToClipboard(JSON.stringify(node, null, 2));
    }
  };

  const handleCopyId = () => {
    if (node) {
      copyToClipboard(node.id);
    }
  };

  if (!node) return null;

  return (
    <div
      ref={drawerRef}
      className={`drawer ${isOpen ? "open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="drawer-header">
        <h2 id="drawer-title" className="drawer-title">
          Node Details
        </h2>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="close-button"
          aria-label="Close drawer"
          type="button"
        >
          ×
        </button>
      </div>

      <div className="drawer-content">
        <div className="node-id">{node.id}</div>
        {node.summary && <div className="node-summary">{node.summary}</div>}

        <h3
          style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}
        >
          Raw JSON
        </h3>
        <div className="json-container">{JSON.stringify(node, null, 2)}</div>
      </div>

      <div className="drawer-actions">
        <button onClick={handleCopyJson} type="button">
          Copy JSON
        </button>
        <button onClick={handleCopyId} type="button">
          Copy ID
        </button>
      </div>
    </div>
  );
}
