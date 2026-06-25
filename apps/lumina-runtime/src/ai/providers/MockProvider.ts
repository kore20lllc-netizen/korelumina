import { auditProject } from "../../audit/auditProject.js";
import { generateFixPlan } from "../../autofix/generateFixPlan.js";
import { createDraft } from "../../drafts/draftStore.js";
import { generateDraftPatches } from "../../drafts/generateFixDrafts.js";
import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

export class MockProvider implements AIProvider {
  async generateDraft(
    input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    const report = auditProject(
      input.projectId,
      input.projectPath,
    );

    const plan = generateFixPlan(
      report,
    );

    const patches = generateDraftPatches(
      input.projectPath,
      plan,
    );

    const draft = createDraft(
      input.projectId,
      patches,
    );

    return {
      mode: "mock_rule_based_draft",
      note:
        "Runtime AI provider is still using the safe rule-based provider. Wire LUMINA_AI_PROVIDER=openai after OpenAIProvider is implemented.",
      prompt: input.prompt,
      report,
      plan,
      draft,
    };
  }
}
