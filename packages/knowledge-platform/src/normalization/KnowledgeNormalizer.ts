import type {
  KnowledgeDocument,
  KnowledgeRecord,
} from "../types/KnowledgeTypes.js";

export interface KnowledgeNormalizer {
  normalize(document: KnowledgeDocument): Promise<KnowledgeRecord>;
}
