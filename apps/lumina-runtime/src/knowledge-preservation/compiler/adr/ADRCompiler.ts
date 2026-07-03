import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

export class ADRCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "adr-compiler";

  readonly version =
    "1.0.0";

  supports(
    evidence: EvidenceItem,
  ): boolean {
    return (
      evidence.type ===
      "ADR"
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
          `adr:${evidence.id}`,

        candidateType:
          "CandidateDecision",

        title:
          evidence.title,

        summary:
          "Recovered architectural decision.",

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
            "adr-compiler",

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
