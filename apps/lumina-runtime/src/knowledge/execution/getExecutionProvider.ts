import type {
  ExecutionProvider,
} from "./ExecutionProvider.js";

import {
  executionProviderRegistry,
} from "./ExecutionProviderRegistry.js";

export function getExecutionProvider(
  providerId: string,
): ExecutionProvider | undefined {
  return executionProviderRegistry.getExecutionProvider(
    providerId,
  );
}
