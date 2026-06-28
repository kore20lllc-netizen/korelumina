import type {
  EngineerAgentInput,
} from "./EngineerAgentInput.js";

import type {
  EngineerAgentRun,
} from "./EngineerAgentRun.js";

import {
  listEngineerAgentProviders,
} from "./listEngineerAgentProviders.js";

export interface EngineerAgentPipelineResult {
  runs: EngineerAgentRun[];
}

export async function runEngineerAgentPipeline(
  input: EngineerAgentInput,
): Promise<EngineerAgentPipelineResult> {
  const providers =
    listEngineerAgentProviders();

  const results =
    await Promise.all(
      providers.map(
        (provider) =>
          provider.orchestrate(input),
      ),
    );

  return {
    runs:
      results.flatMap(
        (result) =>
          result.runs,
      ),
  };
}
