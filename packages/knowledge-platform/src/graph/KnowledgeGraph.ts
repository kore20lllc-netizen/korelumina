import type { KnowledgeRecord } from "../types/KnowledgeTypes.js";

export interface KnowledgeGraph {
  upsert(record: KnowledgeRecord): Promise<void>;
  relate(
    fromId: string,
    toId: string,
    relationship: string,
  ): Promise<void>;
  neighbors(id: string): Promise<KnowledgeRecord[]>;
}
