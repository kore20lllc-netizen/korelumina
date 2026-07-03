import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

export class GitCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "git-compiler";

  readonly version =
    "1.0.0";

  supports(
    evidence: EvidenceItem,
  ): boolean {
    switch (
      evidence.type
    ) {
      case "commit":
      case "tag":
      case "branch":
        return true;

      default:
        return false;
    }
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

    return [
      {
        id:
          `git:${evidence.id}`,

        candidateType:
          "CandidateArtifact",

        title:
          evidence.title,

        summary:
          `Recovered ${evidence.type} evidence.`,

        confidence: 1,

        evidenceRefs: [
          evidence.id,
        ],

        proposedRelationships:
          {},

        extractedAt:
          Date.now(),

        compiler: {
          compilerName:
            this.name,

          compilerVersion:
            this.version,

          evidenceSourceType:
            evidence.type,

          extractedAt:
            Date.now(),

          extractionMethod:
            "git-compiler",

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
