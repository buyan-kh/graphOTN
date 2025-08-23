export interface GoTNNode {
  id: string;
  kind: string;
  summary: string;
  prompt_text: string;
  parent?: string;
  children: string[];
  requires: string[];
  produces: string[];
  exec_target: string;
  embedding_ref?: {
    collection: string;
    id: string;
  };
  tags: string[];
  success_criteria: string[];
  guards: string[];
  artifacts: {
    files: string[];
    outputs: string[];
    dependencies: string[];
  };
  status: 'ready' | 'completed' | 'skipped' | 'failed';
  provenance: {
    created_by: string;
    source: string;
  };
  version: number;
  created_at: string;
  updated_at: string;
}

export interface GoTNEdge {
  src: string;
  dst: string;
  type: 'hard_requires' | 'soft_semantic' | 'derived_from';
  score?: number | null;
  evidence: string;
  provenance: {
    created_by: string;
    source: string;
  };
  version: number;
  created_at: string;
}

export interface GoTNGraph {
  nodes: GoTNNode[];
  edges: GoTNEdge[];
  version: number;
}
