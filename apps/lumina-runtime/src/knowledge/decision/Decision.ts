export type DecisionStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "superseded";

export type DecisionCategory =
  | "architecture"
  | "governance"
  | "runtime"
  | "knowledge"
  | "engineering"
  | "security"
  | "deployment";

export type DecisionOriginType =
  | "ADR"
  | "Reconciliation"
  | "Architecture"
  | "Human"
  | "EngineerAgent";

export interface DecisionOrigin {
  type: DecisionOriginType;

  source: string;
}

export interface DecisionArtifact {
  type: string;

  id: string;

  path?: string;

  description?: string;
}

export interface Decision {
  id: string;

  title: string;

  status: DecisionStatus;

  category: DecisionCategory;

  summary: string;

  rationale: string;

  consequences: string[];

  relatedArtifacts: DecisionArtifact[];

  repositoryId?: string;

  projectId?: string;

  architectureIds: string[];

  engineeringIds: string[];

  runtimeEventIds: string[];

  knowledgeRefs: string[];

  origin: DecisionOrigin;

  supersededBy?: string;

  supersedes: string[];

  approvedBy?: string;

  reviewedAt?: number;

  confidence?: number;

  createdAt: number;

  updatedAt: number;
}
