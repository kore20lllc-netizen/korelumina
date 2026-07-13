export type KnowledgeOperationsStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface KnowledgeOperationsSummary {
  totalKnowledgeItems: number;
  totalEvidence: number;
  healthScore: number;
  promotionRate: number;
}

export interface KnowledgeOperationsAcquisition {
  status: KnowledgeOperationsStatus;
  repository?: string;
  stage?: string;
  filesScanned: number;
  evidenceExtracted: number;
  progress?: number;
  elapsed?: string;
}

export interface KnowledgeOperationsSnapshot {
  generatedAt: number;

  summary: KnowledgeOperationsSummary;

  recovery: {
    status: KnowledgeOperationsStatus;
    repositoryRoot?: string;
    processedEvidence: number;
    totalEvidence: number;
    progress: number;
  };

  acquisition: KnowledgeOperationsAcquisition;

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
