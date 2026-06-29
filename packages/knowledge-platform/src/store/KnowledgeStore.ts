import type { KnowledgeRecord } from "../types/KnowledgeTypes.js";

export interface KnowledgeStore {
  save(record: KnowledgeRecord): Promise<void>;
  load(id: string): Promise<KnowledgeRecord | null>;
  update(record: KnowledgeRecord): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<KnowledgeRecord[]>;
}
