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

  createdAt: number;

  updatedAt: number;
}
