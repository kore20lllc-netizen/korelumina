import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "./EngineeringAutomationContext.js";

export async function runEngineeringAutomationPipeline(
  input: EngineeringAutomationInput,
  stages: ExecutionStage<
    EngineeringAutomationInput,
    EngineeringAutomationState
  >[],
): Promise<ExecutionResult> {
  return runExecutionPipeline(
    {
      id: `engineering:${Date.now()}`,
      input,
      state: {},
      metadata: {
        projectId: input.projectId,
        objective: input.objective,
      },
    },
    stages,
  );
}
