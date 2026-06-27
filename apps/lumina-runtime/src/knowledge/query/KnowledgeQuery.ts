export interface KnowledgeQuery {
  text?: string;

  nodeTypes?: string[];

  edgeTypes?: string[];

  ids?: string[];

  limit?: number;
}

export interface KnowledgeQueryResult<T = unknown> {
  items: T[];

  total: number;
}
