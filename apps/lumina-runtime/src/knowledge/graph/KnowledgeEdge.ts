export interface KnowledgeEdge {
  id: string;

  from: string;

  to: string;

  type: string;

  properties:
    Record<string, unknown>;

  createdAt: number;

  updatedAt: number;
}
