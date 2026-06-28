import type {
  EngineerAgentProvider,
} from "./EngineerAgentProvider.js";

import {
  engineerAgentProviderRegistry,
} from "./EngineerAgentProviderRegistry.js";

export function registerEngineerAgentProvider(
  provider: EngineerAgentProvider,
): void {
  engineerAgentProviderRegistry.registerEngineerAgentProvider(
    provider,
  );
}
