export interface KnowledgeNode {
  id: string;

  type: string;

  label: string;

  properties:
    Record<string, unknown>;

  createdAt: number;

  updatedAt: number;
}
