import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "./RuntimeStartupContext.js";

export async function runRuntimeStartupPipeline(
  input: RuntimeStartupInput,
  stages: ExecutionStage<
    RuntimeStartupInput,
    RuntimeStartupState
  >[],
): Promise<ExecutionResult> {
  return runExecutionPipeline(
    {
      id: `runtime-startup:${input.projectId}`,
      input,
      state: {},
      metadata: {
        projectId: input.projectId,
        isAutoRestart: input.isAutoRestart,
      },
    },
    stages,
  );
}
