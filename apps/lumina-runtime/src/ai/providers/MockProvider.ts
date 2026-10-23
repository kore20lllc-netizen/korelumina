import { auditProject } from "../../audit/auditProject.js";
import { generateFixPlan } from "../../autofix/generateFixPlan.js";
import { createDraft } from "../../drafts/draftStore.js";
import { generateDraftPatches } from "../../drafts/generateFixDrafts.js";
import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

/*
 * No model: drafts come from the audit's rule-based fixes, whatever was
 * asked. The result says so, so the interface never presents it as AI.
 */
export class MockProvider implements AIProvider {
  async generateDraft(
    input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    const report = auditProject(input.projectId, input.projectPath);
    const plan = generateFixPlan(report);
    const patches = generateDraftPatches(input.projectPath, plan);
    const draft = createDraft(input.projectId, patches);

    return {
      mode: "rule_based_draft",
      provider: "rule-based",
      note:
        "No AI model is configured, so these are the audit's rule-based fixes, not an answer to your request.",
      prompt: input.prompt,
      report,
      plan,
      draft,
    };
  }
}
