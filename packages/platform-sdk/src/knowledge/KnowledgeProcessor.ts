import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

export interface KnowledgeProcessor {
  supports(
    object: KnowledgeObject,
  ): boolean;

  process(
    object: KnowledgeObject,
  ): Promise<void>;
}
