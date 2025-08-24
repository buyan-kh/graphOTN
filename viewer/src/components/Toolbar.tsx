import React from "react";
import { LayoutMode } from "../types";

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReload: () => void;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  isLoading: boolean;
  onExport: () => void;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  onReload,
  layoutMode,
  onLayoutChange,
  showLegend,
  onToggleLegend,
  isLoading,
  onExport,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="filter nodes…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
        aria-label="Filter nodes by ID or summary"
      />

      <button
        onClick={onReload}
        disabled={isLoading}
        aria-label="Reload graph data (Ctrl+R)"
        title="Reload graph data (Ctrl+R)"
      >
        {isLoading ? "Loading..." : "Reload"}
      </button>

      <select
        value={layoutMode}
        onChange={(e) => onLayoutChange(e.target.value as LayoutMode)}
        className="layout-select"
        aria-label="Layout direction"
      >
        <option value="TD">Top-Down</option>
        <option value="LR">Left-Right</option>
      </select>

      <button
        onClick={onToggleLegend}
        aria-label={showLegend ? "Hide legend" : "Show legend"}
        title={showLegend ? "Hide legend" : "Show legend"}
      >
        Legend
      </button>

      <button
        onClick={onExport}
        aria-label="Export graph as JSON"
        title="Export graph as JSON"
      >
        Export
      </button>
    </div>
  );
}
