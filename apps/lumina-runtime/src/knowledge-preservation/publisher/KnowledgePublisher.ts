import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export interface KnowledgePublisher {
  readonly name: string;

  readonly version: string;

  publish(
    items: readonly KnowledgeIRItem[],
  ): Promise<void>;
}
