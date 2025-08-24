import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchGraph, fetchProjects, Project } from "./api/client";
import { computeLayout, detectCycles } from "./utils/layout";
import { filterIds, mapToReactFlow, exportGraphAsJson } from "./utils/graph";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { Legend } from "./components/Legend";
import { GraphView } from "./components/GraphView";
import { NodeModal } from "./components/NodeModal";
import { Notice } from "./components/Notice";
import { Footer } from "./components/Footer";
import { AppState, RawNode } from "./types";

const DEBOUNCE_MS = 200;

function App() {
  const [state, setState] = useState<AppState>({
    graph: null,
    filteredIds: new Set(),
    selectedNodeId: null,
    lastLoadedAt: 0,
    layoutMode: "TD",
    error: null,
    isLoading: false,
    showLegend: true,
    searchQuery: "",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string>("demo");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const projectList = await fetchProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    }
  }, []);

  // Load graph data for current project
  const loadGraph = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const graph = await fetchGraph(currentProject);
      setState((prev) => ({
        ...prev,
        graph,
        lastLoadedAt: Date.now(),
        isLoading: false,
        filteredIds: new Set(graph.nodes.map((n) => n.id)),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load graph",
        isLoading: false,
      }));
    }
  }, [currentProject]);

  // Load projects and graph on mount
  useEffect(() => {
    loadProjects();
    loadGraph();
  }, [loadProjects, loadGraph]);

  // Handle project change
  const handleProjectChange = useCallback((projectId: string) => {
    setCurrentProject(projectId);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        if (state.graph) {
          const filtered = filterIds(state.graph.nodes, query);
          setState((prev) => ({ ...prev, filteredIds: filtered }));
        }
      }, DEBOUNCE_MS);

      setDebounceTimer(timer);
    },
    [state.graph, debounceTimer]
  );

  // Handle search input
  const handleSearchChange = useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, searchQuery: query }));
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Handle layout change
  const handleLayoutChange = useCallback((layoutMode: "TD" | "LR") => {
    setState((prev) => ({ ...prev, layoutMode }));
  }, []);

  // Handle node selection
  const handleNodeClick = useCallback((nodeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedNodeId: prev.selectedNodeId === nodeId ? null : nodeId,
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState((prev) => ({ ...prev, selectedNodeId: null }));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (state.graph) {
      exportGraphAsJson(state.graph);
    }
  }, [state.graph]);

  // Handle error dismissal
  const handleDismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "/":
          e.preventDefault();
          const searchInput = document.querySelector(
            ".search-input"
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
        case "r":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            loadGraph();
          }
          break;
        case "escape":
          if (state.selectedNodeId) {
            handleCloseModal();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loadGraph, state.selectedNodeId, handleCloseModal]);

  // URL state sync
  useEffect(() => {
    const url = new URL(window.location.href);

    // Update URL params
    if (state.searchQuery) {
      url.searchParams.set("q", state.searchQuery);
    } else {
      url.searchParams.delete("q");
    }

    if (state.selectedNodeId) {
      url.searchParams.set("node", state.selectedNodeId);
    } else {
      url.searchParams.delete("node");
    }

    if (state.layoutMode !== "TD") {
      url.searchParams.set("layout", state.layoutMode);
    } else {
      url.searchParams.delete("layout");
    }

    window.history.replaceState({}, "", url.toString());
  }, [state.searchQuery, state.selectedNodeId, state.layoutMode]);

  // Load URL state on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q") || "";
    const nodeId = url.searchParams.get("node");
    const layout = (url.searchParams.get("layout") as "TD" | "LR") || "TD";

    setState((prev) => ({
      ...prev,
      searchQuery: query,
      selectedNodeId: nodeId,
      layoutMode: layout,
    }));

    if (query) {
      debouncedSearch(query);
    }
  }, [debouncedSearch]);

  // Compute layout and React Flow data
  const { reactFlowNodes, reactFlowEdges, layoutResult, selectedNode } =
    useMemo(() => {
      if (!state.graph) {
        return {
          reactFlowNodes: [],
          reactFlowEdges: [],
          layoutResult: null,
          selectedNode: null,
        };
      }

      const layoutResult = computeLayout(
        state.graph.nodes,
        state.graph.edges,
        state.layoutMode
      );
      const { nodes, edges } = mapToReactFlow(
        state.graph.nodes,
        state.graph.edges,
        layoutResult.positions,
        state.filteredIds
      );

      const selectedNode = state.selectedNodeId
        ? state.graph.nodes.find((n) => n.id === state.selectedNodeId) || null
        : null;

      return {
        reactFlowNodes: nodes,
        reactFlowEdges: edges,
        layoutResult,
        selectedNode,
      };
    }, [
      state.graph,
      state.filteredIds,
      state.layoutMode,
      state.selectedNodeId,
    ]);

  const hasCycle = state.graph
    ? detectCycles(state.graph.nodes, state.graph.edges)
    : false;

  return (
    <div className="app">
      <Header
        isConnected={!state.error && state.graph !== null}
        lastLoadedAt={state.lastLoadedAt}
      />

      <div className="project-selector">
        <label htmlFor="project-select">Project:</label>
        <select
          id="project-select"
          value={currentProject}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="project-select-dropdown"
        >
          <option value="demo">Demo Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.nodes} nodes, {project.edges} edges)
            </option>
          ))}
        </select>
      </div>

      <Toolbar
        searchQuery={state.searchQuery}
        onSearchChange={handleSearchChange}
        onReload={loadGraph}
        layoutMode={state.layoutMode}
        onLayoutChange={handleLayoutChange}
        showLegend={state.showLegend}
        onToggleLegend={() =>
          setState((prev) => ({ ...prev, showLegend: !prev.showLegend }))
        }
        isLoading={state.isLoading}
        onExport={handleExport}
      />

      {state.error && (
        <Notice
          type="error"
          message={state.error}
          onDismiss={handleDismissError}
          action={{
            label: "Retry",
            onClick: loadGraph,
          }}
        />
      )}

      {hasCycle && (
        <Notice
          type="warning"
          message="Cycle detected in hard edges; layout degraded."
        />
      )}

      <main className="main">
        <div className="graph-container">
          <GraphView
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodeClick={handleNodeClick}
            onFitView={() => {}}
          />

          <Legend
            show={state.showLegend}
            totalNodes={state.graph?.nodes.length || 0}
            visibleNodes={reactFlowNodes.length}
            edges={state.graph?.edges || []}
            visibleEdges={reactFlowEdges.length}
          />
        </div>

        <NodeModal
          node={selectedNode}
          isOpen={!!state.selectedNodeId}
          onClose={handleCloseModal}
        />
      </main>

      <Footer
        totalNodes={state.graph?.nodes.length || 0}
        totalEdges={state.graph?.edges.length || 0}
        visibleNodes={reactFlowNodes.length}
        visibleEdges={reactFlowEdges.length}
      />
    </div>
  );
}

export default App;
