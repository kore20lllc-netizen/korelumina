export type KnowledgeObjectStatus =
  | "draft"
  | "active"
  | "archived"
  | "superseded";

export interface KnowledgeObject {
  id: string;

  type: string;

  version: number;

  status: KnowledgeObjectStatus;

  createdAt: number;

  updatedAt: number;

  metadata: Record<
    string,
    unknown
  >;
}
