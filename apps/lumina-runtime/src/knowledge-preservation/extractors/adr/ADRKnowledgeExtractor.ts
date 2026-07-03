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
    title: string,
    content: string,
  ): Promise<
    KnowledgeIRItem[]
  > {
    const now =
      Date.now();

    const summary =
      content
        .split(/\r?\n/)
        .find(
          (line) =>
            line.trim().length > 0 &&
            !line.startsWith("#"),
        ) ??
      "Recovered architectural decision.";

    return [
      {
        id:
          `adr:${title}`,

        candidateType:
          "CandidateDecision",

        title,

        summary:
          summary.trim(),

        confidence:
          0.8,

        evidenceRefs:
          [],

        proposedRelationships:
          {},

        extractedAt:
          now,

        compiler: {
          compilerName:
            this.name,

          compilerVersion:
            "1.0.0",

          evidenceSourceType:
            "ADR",

          extractedAt:
            now,

          extractionMethod:
            "adr-extractor",

          confidenceBasis:
            "document-analysis",
        },

        status:
          "extracted",

        metadata:
          {},
      },
    ];
  }
}
