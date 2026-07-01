import type {
  ExecutionStageResult,
} from "@korelumina/platform-sdk";

import type {
  EngineeringCompletionContext,
} from "./EngineeringCompletionPipeline.js";

export async function runReportStage(
  context: EngineeringCompletionContext,
): Promise<ExecutionStageResult> {
  context.state.reportGenerated = true;

  return {
    stage: "report",
    success: true,
    metadata: {
      phase: context.input.phase,
      title: context.input.title,
      commit: context.input.commit,
      tag: context.input.tag,
      adrIds: context.input.adrIds ?? [],
      milestoneId: context.input.milestoneId,
      generatedAt: Date.now(),
    },
  };
}
