import type {
  PublicRuntimeRecord,
} from "../registry.js";

import {
  runRuntimeStartupPipeline,
} from "./pipeline/RuntimeStartupPipeline.js";

import {
  ResolveProjectStage,
  ValidateProjectStage,
  PrepareRuntimeStage,
  LaunchRuntimeStage,
  BindLifecycleStage,
  WaitForReadyStage,
} from "./pipeline/Stages/index.js";

export type RuntimeCoordinatorOptions = {
  projectId: string;
  isAutoRestart: boolean;
  restartProject: (
    projectId: string,
  ) => Promise<void>;
};

export async function coordinateRuntimeStartup({
  projectId,
  isAutoRestart,
  restartProject,
}: RuntimeCoordinatorOptions): Promise<PublicRuntimeRecord> {
  const result =
    await runRuntimeStartupPipeline(
      {
        projectId,
        isAutoRestart,
        restartProject,
      },
      [
        ResolveProjectStage,
        ValidateProjectStage,
        PrepareRuntimeStage,
        LaunchRuntimeStage,
        BindLifecycleStage,
        WaitForReadyStage,
      ],
    );

  if (!result.execution.success) {
    throw new Error(
      "runtime_startup_pipeline_failed",
    );
  }

  if (!result.state.result) {
    throw new Error(
      "runtime_startup_result_missing",
    );
  }

  return result.state.result;
}
