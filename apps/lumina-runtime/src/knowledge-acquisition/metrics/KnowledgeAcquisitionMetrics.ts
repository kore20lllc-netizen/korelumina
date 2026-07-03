export interface KnowledgeAcquisitionMetrics {
  provider: string;

  startedAt: number;

  finishedAt: number;

  durationMs: number;

  acquiredEvidence: number;

  preservedEvidence: number;

  compiledEvidence: number;

  normalizedEvidence: number;

  validatedEvidence: number;

  canonicalKnowledge: number;

  rejectedEvidence: number;

  failedEvidence: number;
}
