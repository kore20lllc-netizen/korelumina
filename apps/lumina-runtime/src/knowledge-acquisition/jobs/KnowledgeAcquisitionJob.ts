export type KnowledgeAcquisitionJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface KnowledgeAcquisitionJobProgress {
  processed: number;
  total: number;
  progress: number;
  currentItem?: string;
}

export interface KnowledgeAcquisitionJobResult {
  acquiredEvidence: number;
  preservedEvidence: number;
}

export interface KnowledgeAcquisitionJob {
  readonly id: string;
  readonly providerName: string;

  status: KnowledgeAcquisitionJobStatus;
  progress: KnowledgeAcquisitionJobProgress;

  run(): Promise<KnowledgeAcquisitionJobResult>;
}
