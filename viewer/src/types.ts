export type RawNode = {
  id: string;
  summary?: string;
  [k: string]: any;
};

export type RawEdge = {
  src: string;
  dst: string;
  type?: string;
  score?: number;
  [k: string]: any;
};

export type GraphPayload = {
  nodes: RawNode[];
  edges: RawEdge[];
};

export type LayoutMode = "TD" | "LR";

export type AppState = {
  graph: GraphPayload | null;
  filteredIds: Set<string>;
  selectedNodeId: string | null;
  lastLoadedAt: number;
  layoutMode: LayoutMode;
  error: string | null;
  isLoading: boolean;
  showLegend: boolean;
  searchQuery: string;
};

export type NodePosition = {
  x: number;
  y: number;
};

export type LayoutResult = {
  positions: Record<string, NodePosition>;
  layers: string[][];
  hasCycle: boolean;
};
