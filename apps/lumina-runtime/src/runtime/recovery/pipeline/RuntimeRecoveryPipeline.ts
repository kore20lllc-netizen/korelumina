import {
  runExecutionPipeline,
  type ExecutionResult,
  type ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "./RuntimeRecoveryContext.js";

export async function runRuntimeRecoveryPipeline(
  input: RuntimeRecoveryInput,
  stages: ExecutionStage<
    RuntimeRecoveryInput,
    RuntimeRecoveryState
  >[],
): Promise<ExecutionResult> {
  return runExecutionPipeline(
    {
      id: `runtime-recovery:${input.projectId}`,
      input,
      state: {
        recoveryReason:
          input.reason,
      },
      metadata: {
        projectId: input.projectId,
        reason: input.reason,
      },
    },
    stages,
  );
}
