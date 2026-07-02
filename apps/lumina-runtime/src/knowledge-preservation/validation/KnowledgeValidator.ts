import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export interface KnowledgeValidator {
  readonly name: string;

  readonly version: string;

  supports(
    item: KnowledgeIRItem,
  ): boolean;

  validate(
    item: KnowledgeIRItem,
  ): Promise<KnowledgeIRItem>;
}
