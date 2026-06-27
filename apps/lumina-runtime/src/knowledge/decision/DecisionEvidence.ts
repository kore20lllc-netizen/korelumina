export type DecisionEvidenceType =
  | "implementation"
  | "validation"
  | "benchmark"
  | "adr"
  | "runtime"
  | "engineering-ticket"
  | "reconciliation"
  | "architecture-document";

export interface DecisionEvidence {
  id: string;

  decisionId: string;

  type: DecisionEvidenceType;

  summary: string;

  source?: string;

  capturedAt: number;
}
