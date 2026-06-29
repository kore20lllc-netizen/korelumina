import type { KnowledgeDocument } from "../types/KnowledgeTypes.js";

export interface KnowledgeSource {
  id: string;
  name: string;

  scan(): Promise<KnowledgeDocument[]>;
}
