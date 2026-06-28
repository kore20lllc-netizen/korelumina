import type {
  EngineerAgentProvider,
} from "./EngineerAgentProvider.js";

import {
  engineerAgentProviderRegistry,
} from "./EngineerAgentProviderRegistry.js";

export function getEngineerAgentProvider(
  providerId: string,
): EngineerAgentProvider | undefined {
  return engineerAgentProviderRegistry.getEngineerAgentProvider(
    providerId,
  );
}
