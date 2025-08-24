import { GraphPayload } from "../types";

let abortController: AbortController | null = null;

export interface Project {
  id: string;
  name: string;
  nodes: number;
  edges: number;
  created_at: string;
}

export async function fetchGraph(projectId?: string): Promise<GraphPayload> {
  // Cancel any ongoing request
  if (abortController) {
    abortController.abort();
  }

  abortController = new AbortController();

  try {
    const url = projectId ? `/api/graph?project_id=${encodeURIComponent(projectId)}` : "/api/graph";
    const response = await fetch(url, {
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure we have the expected structure
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request cancelled");
    }
    throw error;
  } finally {
    abortController = null;
  }
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await fetch("/api/projects");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export function cancelFetch(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}
