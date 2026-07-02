import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export interface KnowledgeNormalizer {
  readonly name: string;

  readonly version: string;

  supports(
    item: KnowledgeIRItem,
  ): boolean;

  normalize(
    item: KnowledgeIRItem,
  ): Promise<KnowledgeIRItem>;
}
