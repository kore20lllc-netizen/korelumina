export interface KnowledgeGraphNodeIndexEntry {
  nodeId: string;

  type: string;

  label: string;

  updatedAt: number;
}

export interface KnowledgeGraphEdgeIndexEntry {
  edgeId: string;

  from: string;

  to: string;

  type: string;

  updatedAt: number;
}

export interface KnowledgeGraphIndex {
  nodes:
    KnowledgeGraphNodeIndexEntry[];

  edges:
    KnowledgeGraphEdgeIndexEntry[];

  adjacency:
    Record<string, string[]>;

  reverseAdjacency:
    Record<string, string[]>;
}
