import type {
  ExecutionProvider,
} from "./ExecutionProvider.js";

import {
  executionProviderRegistry,
} from "./ExecutionProviderRegistry.js";

export function registerExecutionProvider(
  provider: ExecutionProvider,
): void {
  executionProviderRegistry.registerExecutionProvider(
    provider,
  );
}
