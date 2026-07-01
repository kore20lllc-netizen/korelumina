import type {
  ExecutionStage,
} from "./ExecutionStage.js";

const stages = new Map<
  string,
  ExecutionStage[]
>();

export function registerExecutionStage(
  pipeline: string,
  stage: ExecutionStage,
) {
  const existing =
    stages.get(pipeline) ?? [];

  existing.push(stage);

  stages.set(
    pipeline,
    existing,
  );
}

export function listExecutionStages(
  pipeline: string,
): ExecutionStage[] {
  return [
    ...(stages.get(pipeline) ?? []),
  ];
}

export function clearExecutionStages(
  pipeline: string,
) {
  stages.delete(pipeline);
}
