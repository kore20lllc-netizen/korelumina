import type {
  ExecutionContext,
} from "./ExecutionContext.js";

import type {
  ExecutionStageResult,
} from "./ExecutionResult.js";

export interface ExecutionStage<
  TInput = unknown,
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;

  run(
    context: ExecutionContext<
      TInput,
      TState
    >,
  ): Promise<ExecutionStageResult>;
}
