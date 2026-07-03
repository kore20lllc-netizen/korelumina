import type {
  EvidenceItem,
  EvidenceType,
} from "../../knowledge-preservation/evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../knowledge-preservation/ir/index.js";

import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  RecoveryReport,
} from "./RecoveryReport.js";

export class RecoveryReportGenerator {
  generate(args: {
    repositoryRoot: string;
    evidence: readonly EvidenceItem[];
    candidates: readonly KnowledgeIRItem[];
    canonical: readonly CanonicalKnowledgeItem[];
  }): RecoveryReport {
    const byType: Partial<
      Record<EvidenceType, number>
    > = {};

    for (const item of args.evidence) {
      byType[item.type] =
        (byType[item.type] ?? 0) + 1;
    }

    const supportedEvidence =
      args.candidates.length;

    const unsupportedEvidence =
      Math.max(
        0,
        args.evidence.length -
          supportedEvidence,
      );

    const promotionRate =
      args.candidates.length === 0
        ? 0
        : args.canonical.length /
          args.candidates.length;

    return {
      generatedAt: Date.now(),

      repositoryRoot:
        args.repositoryRoot,

      evidence: {
        total:
          args.evidence.length,
        byType,
      },

      knowledge: {
        candidateItems:
          args.candidates.length,
        canonicalItems:
          args.canonical.length,
      },

      coverage: {
        supportedEvidence,
        unsupportedEvidence,
        promotionRate,
      },
    };
  }
}
