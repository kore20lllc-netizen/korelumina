export type KnowledgeCapsuleState =
  | "queued"
  | "processing"
  | "waiting"
  | "blocked"
  | "failed"
  | "needs-review"
  | "validated"
  | "approved"
  | "published"
  | "adapted"
  | "consumed"
  | "superseded"
  | "archived";

export type KnowledgeCapsuleIntegrity =
  | "sealed"
  | "peeling"
  | "resealing";

export interface KnowledgeCapsuleLayer {
  id: string;
  label: string;
  status:
    | "healthy"
    | "warning"
    | "failed";
  detail: string;
}

export interface KnowledgeCapsule {
  id: string;
  identity: string;
  title: string;
  summary: string;
  stage: string;
  destination: string;
  state: KnowledgeCapsuleState;
  integrity: KnowledgeCapsuleIntegrity;
  authority: string;
  confidence: number;
  owner: string;
  approval: string;
  packageType: string;
  mission: string;
  compiler: string;
  educationalModule: string;
  consumer: string;
  sources: string[];
  failedLayer?: string;
  remediation?: string;
  responsibleAuthority?: string;
  blockedDependencies?: string[];
  layers: KnowledgeCapsuleLayer[];
}
