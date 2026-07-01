import type {
  ExecutionContext,
} from "./ExecutionContext.js";

import type {
  ExecutionResult,
  ExecutionStageResult,
} from "./ExecutionResult.js";

import type {
  ExecutionStage,
} from "./ExecutionStage.js";

export async function runExecutionPipeline<
  TInput = unknown,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(
  context: ExecutionContext<
    TInput,
    TState
  >,
  stages: ExecutionStage<
    TInput,
    TState
  >[],
): Promise<ExecutionResult> {
  const results: ExecutionStageResult[] = [];

  for (const stage of stages) {
    const result =
      await stage.run(context);

    results.push(result);

    if (!result.success) {
      break;
    }
  }

  return {
    id: context.id,
    success:
      results.every(
        (result) => result.success,
      ),
    stages: results,
    metadata:
      context.metadata,
  };
}
