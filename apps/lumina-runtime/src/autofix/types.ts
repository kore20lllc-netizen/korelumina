import type { AuditFinding, AuditReport } from "../audit/auditTypes.js";

export type FixRisk = "low" | "medium" | "high";

export type FixAction = {
  id: string;
  findingId: string;
  title: string;
  reason: string;
  autoFixable: boolean;
  risk: FixRisk;
  files: string[];
  diffPreview: string;
  projectedImpact: number;
};

export type FixPlan = {
  projectId: string;
  currentScore: number;
  projectedScore: number;
  autoFixableCount: number;
  manualReviewCount: number;
  fixes: FixAction[];
  manualReviewFindings: AuditFinding[];
  generatedAt: number;
};

export type FixGenerator = {
  match: (finding: AuditFinding) => boolean;
  generate: (finding: AuditFinding, report: AuditReport) => FixAction;
};
