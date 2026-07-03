import type {
  KnowledgeIRItem,
} from "../ir/index.js";

export interface DocumentationKnowledgeExtractor {
  readonly name: string;

  supports(
    documentType: string,
  ): boolean;

  extract(
    title: string,
    content: string,
  ): Promise<
    KnowledgeIRItem[]
  >;
}
