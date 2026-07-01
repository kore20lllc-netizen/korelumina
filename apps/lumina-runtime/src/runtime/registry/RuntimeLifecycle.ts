import {
  listRuntimes,
} from "../registry.js";

import {
  runRuntimeShutdownPipeline,
  ResolveRuntimeStage,
  ValidateShutdownStage,
  TerminateRuntimeStage,
  CleanupRuntimeStage,
  ReportStage,
} from "../shutdown/pipeline/index.js";

export async function stopRuntime(
  projectId: string,
): Promise<boolean> {
  const result =
    await runRuntimeShutdownPipeline(
      {
        projectId,
      },
      [
        ResolveRuntimeStage,
        ValidateShutdownStage,
        TerminateRuntimeStage,
        CleanupRuntimeStage,
        ReportStage,
      ],
    );

  return result.success;
}

export async function stopAllRuntimes(): Promise<void> {
  const runtimes =
    listRuntimes();

  await Promise.all(
    runtimes.map(
      (runtime) =>
        stopRuntime(
          runtime.projectId,
        ),
    ),
  );
}
