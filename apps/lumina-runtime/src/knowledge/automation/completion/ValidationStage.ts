import type {
  ExecutionStageResult,
} from "@korelumina/platform-sdk";

import type {
  EngineeringCompletionContext,
} from "./EngineeringCompletionPipeline.js";

export async function runValidationStage(
  context: EngineeringCompletionContext,
): Promise<ExecutionStageResult> {
  const passed =
    context.input.validation.every(
      (item) => item.passed,
    );

  context.state.validationPassed =
    passed;

  return {
    stage: "validation",
    success: passed,
    metadata: {
      validation: context.input.validation,
    },
  };
}
