import type { AuditReport } from "../audit/auditTypes.js";
import type { FixPlan } from "../autofix/types.js";
import type { FixDraft } from "../drafts/types.js";

/*
 * MS-2026-0011 (Developer AI Assist): the file the person is looking at,
 * and the lines they selected, so the model edits what was asked about.
 */
export interface DraftFocus {
  file: string;
  startLine?: number;
  endLine?: number;
}

export interface GenerateDraftInput {
  projectId: string;
  projectPath: string;
  prompt: string;
  focus?: DraftFocus;
}

export interface GenerateDraftResult {
  mode: string;
  provider: string;
  model?: string;
  note?: string;
  summary?: string;
  rejected?: string[];
  prompt: string;
  report?: AuditReport;
  plan?: FixPlan;
  draft: FixDraft;
}

export interface AIProvider {
  generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult>;
}
