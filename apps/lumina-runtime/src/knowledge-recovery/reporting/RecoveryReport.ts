import type {
  EvidenceType,
} from "../../knowledge-preservation/evidence/index.js";

export interface RecoveryReport {
  generatedAt: number;

  repositoryRoot: string;

  evidence: {
    total: number;
    byType: Partial<
      Record<
        EvidenceType,
        number
      >
    >;
  };

  knowledge: {
    candidateItems: number;
    canonicalItems: number;
  };

  coverage: {
    supportedEvidence: number;
    unsupportedEvidence: number;
    promotionRate: number;
  };
}
