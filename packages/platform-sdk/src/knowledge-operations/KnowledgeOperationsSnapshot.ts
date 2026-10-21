export type KnowledgeOperationsStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface KnowledgeOperationsSummary {
  totalKnowledgeItems: number;
  totalEvidence: number;
  /* No governed health algorithm exists yet: null means not measured. */
  healthScore: number | null;
  promotionRate: number;
}

export interface KnowledgeOperationsAcquisition {
  status: KnowledgeOperationsStatus;
  repository?: string;
  stage: string;
  filesScanned: number;
  evidenceExtracted: number;
  elapsed?: string;
  progress: number;
}

export interface KnowledgeOperationsSnapshot {
  generatedAt: number;

  summary: KnowledgeOperationsSummary;

  acquisition: KnowledgeOperationsAcquisition;

  recovery: {
    status: KnowledgeOperationsStatus;
    repositoryRoot?: string;
    processedEvidence: number;
    totalEvidence: number;
    progress: number;
  };

  evidence: {
    total: number;
    byType: Record<string, number>;
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
