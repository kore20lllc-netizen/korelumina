import type {
  ExecutionProvider,
} from "./ExecutionProvider.js";

import {
  executionProviderRegistry,
} from "./ExecutionProviderRegistry.js";

export function listExecutionProviders(): readonly ExecutionProvider[] {
  return executionProviderRegistry.listExecutionProviders();
}
