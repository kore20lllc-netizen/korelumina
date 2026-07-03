import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  DocumentationKnowledgeExtractor,
} from "../DocumentationKnowledgeExtractor.js";

export class ADRKnowledgeExtractor
  implements DocumentationKnowledgeExtractor
{
  readonly name =
    "adr-knowledge-extractor";

  supports(
    documentType: string,
  ): boolean {
    return (
      documentType ===
      "ADR"
    );
  }

  async extract(
    _title: string,
    _content: string,
  ): Promise<
    KnowledgeIRItem[]
  > {
    return [];
  }
}
