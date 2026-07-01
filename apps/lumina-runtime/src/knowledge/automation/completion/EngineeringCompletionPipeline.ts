import {
  runExecutionPipeline,
  type ExecutionContext,
  type ExecutionStage,
  type ExecutionResult,
} from "@korelumina/platform-sdk";

import type {
  EngineeringCompletionInput,
} from "../EngineeringCompletionOrchestrator.js";

export type EngineeringCompletionState = {
  phaseCompleted?: boolean;
  validationPassed?: boolean;
  reportGenerated?: boolean;
};

export type EngineeringCompletionContext =
  ExecutionContext<
    EngineeringCompletionInput,
    EngineeringCompletionState
  >;

export async function runEngineeringCompletionPipeline(
  input: EngineeringCompletionInput,
  stages: ExecutionStage<
    EngineeringCompletionInput,
    EngineeringCompletionState
  >[],
): Promise<ExecutionResult> {
  const context: EngineeringCompletionContext = {
    id: `engineering-completion:${input.phase}`,
    input,
    state: {},
    metadata: {
      phase: input.phase,
      title: input.title,
      commit: input.commit,
      tag: input.tag,
      adrIds: input.adrIds ?? [],
      milestoneId: input.milestoneId,
    },
  };

  return runExecutionPipeline(
    context,
    stages,
  );
}
