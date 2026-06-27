export interface KnowledgeRecord<T = unknown> {
  id: string;
  type: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  data: T;
}
