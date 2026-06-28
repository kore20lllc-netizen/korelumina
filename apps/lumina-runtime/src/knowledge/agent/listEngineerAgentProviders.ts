import type {
  EngineerAgentProvider,
} from "./EngineerAgentProvider.js";

import {
  engineerAgentProviderRegistry,
} from "./EngineerAgentProviderRegistry.js";

export function listEngineerAgentProviders(): readonly EngineerAgentProvider[] {
  return engineerAgentProviderRegistry.listEngineerAgentProviders();
}
