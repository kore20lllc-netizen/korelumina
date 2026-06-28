import type {
  ExecutionInput,
} from "./ExecutionInput.js";

import type {
  ExecutionResult,
} from "./ExecutionResult.js";

export interface ExecutionProviderResult {
  results: ExecutionResult[];
}

export interface ExecutionProvider {
  id: string;

  execute(
    input: ExecutionInput,
  ): Promise<ExecutionProviderResult>;
}
