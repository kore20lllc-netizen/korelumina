import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "./RuntimeStartupContext.js";

export interface RuntimeStartupPipelineResult {
  execution: ExecutionResult;
  state: RuntimeStartupState;
}

export async function runRuntimeStartupPipeline(
  input: RuntimeStartupInput,
  stages: ExecutionStage<
    RuntimeStartupInput,
    RuntimeStartupState
  >[],
): Promise<RuntimeStartupPipelineResult> {
  const state: RuntimeStartupState = {};

  const execution =
    await runExecutionPipeline(
      {
        id: `runtime-startup:${input.projectId}`,
        input,
        state,
        metadata: {
          projectId: input.projectId,
          isAutoRestart: input.isAutoRestart,
        },
      },
      stages,
    );

  return {
    execution,
    state,
  };
}
