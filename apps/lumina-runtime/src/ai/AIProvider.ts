import type { AuditReport } from "../audit/auditTypes.js";
import type { FixPlan } from "../autofix/types.js";
import type { FixDraft } from "../drafts/types.js";

export interface GenerateDraftInput {
  projectId: string;
  projectPath: string;
  prompt: string;
}

export interface GenerateDraftResult {
  mode: string;
  note?: string;
  prompt: string;
  report: AuditReport;
  plan: FixPlan;
  draft: FixDraft;
}

export interface AIProvider {
  generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult>;
}
