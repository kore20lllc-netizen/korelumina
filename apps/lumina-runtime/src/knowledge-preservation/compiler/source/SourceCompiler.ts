import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

export class SourceCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "source-compiler";

  readonly version =
    "1.0.0";

  supports(
    evidence: EvidenceItem,
  ): boolean {
    return (
      evidence.type ===
      "source-file"
    );
  }

  async compile(
    evidence: EvidenceItem,
  ): Promise<
    KnowledgeIRItem[]
  > {
    if (
      !this.supports(
        evidence,
      )
    ) {
      return [];
    }

    const now =
      Date.now();

    return [
      {
        id:
          `source:${evidence.id}`,

        candidateType:
          "CandidateComponent",

        title:
          evidence.title,

        summary:
          "Recovered source artifact.",

        confidence: 1,

        evidenceRefs: [
          evidence.id,
        ],

        proposedRelationships:
          {},

        extractedAt:
          now,

        compiler: {
          compilerName:
            this.name,

          compilerVersion:
            this.version,

          evidenceSourceType:
            evidence.type,

          extractedAt:
            now,

          extractionMethod:
            "source-compiler",

          confidenceBasis:
            "direct-evidence",
        },

        status:
          "extracted",

        metadata: {
          source:
            evidence.source,
        },
      },
    ];
  }
}
