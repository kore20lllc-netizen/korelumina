import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "./RuntimeShutdownContext.js";

export async function runRuntimeShutdownPipeline(
  input: RuntimeShutdownInput,
  stages: ExecutionStage<
    RuntimeShutdownInput,
    RuntimeShutdownState
  >[],
): Promise<ExecutionResult> {
  return runExecutionPipeline(
    {
      id: `runtime-shutdown:${input.projectId}`,
      input,
      state: {},
      metadata: {
        projectId: input.projectId,
      },
    },
    stages,
  );
}
