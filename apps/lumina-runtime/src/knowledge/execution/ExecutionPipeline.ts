import type {
  ExecutionInput,
} from "./ExecutionInput.js";

import type {
  ExecutionResult,
} from "./ExecutionResult.js";

import {
  listExecutionProviders,
} from "./listExecutionProviders.js";

export interface ExecutionPipelineResult {
  results: ExecutionResult[];
}

export async function runExecutionPipeline(
  input: ExecutionInput,
): Promise<ExecutionPipelineResult> {
  const providers =
    listExecutionProviders();

  const results =
    await Promise.all(
      providers.map(
        (provider) =>
          provider.execute(input),
      ),
    );

  return {
    results:
      results.flatMap(
        (result) =>
          result.results,
      ),
  };
}
