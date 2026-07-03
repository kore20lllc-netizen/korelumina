import type {
  EvidenceType,
} from "../knowledge-preservation/evidence/index.js";

export interface KnowledgeOperationsSnapshot {
  generatedAt: number;

  recovery: {
    status:
      | "idle"
      | "running"
      | "completed"
      | "failed";

    repositoryRoot?: string;

    processedEvidence: number;

    totalEvidence: number;

    progress: number;
  };

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

    promotionRate: number;
  };

  coverage: {
    documentation: number;
    git: number;
    conversations: number;
    runtime: number;
    issues: number;
    pullRequests: number;
  };
}
