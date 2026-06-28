import type {
  EngineerAgentInput,
} from "./EngineerAgentInput.js";

import type {
  EngineerAgentRun,
} from "./EngineerAgentRun.js";

export interface EngineerAgentProviderResult {
  runs: EngineerAgentRun[];
}

export interface EngineerAgentProvider {
  id: string;

  orchestrate(
    input: EngineerAgentInput,
  ): Promise<EngineerAgentProviderResult>;
}
