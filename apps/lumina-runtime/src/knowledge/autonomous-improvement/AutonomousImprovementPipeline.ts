import type {
  EngineeringStandardUpdate,
} from "./EngineeringStandardUpdate.js";

import type {
  AutonomousImprovementInput,
} from "./AutonomousImprovementInput.js";

import type {
  ImprovementProposal,
} from "./ImprovementProposal.js";

import {
  listAutonomousImprovementProviders,
} from "./listAutonomousImprovementProviders.js";

export interface AutonomousImprovementPipelineResult {
  proposals: ImprovementProposal[];

  standards: EngineeringStandardUpdate[];
}

export async function runAutonomousImprovementPipeline(
  input: AutonomousImprovementInput,
): Promise<AutonomousImprovementPipelineResult> {
  const providers =
    listAutonomousImprovementProviders();

  const results =
    await Promise.all(
      providers.map(
        (provider) =>
          provider.improve(input),
      ),
    );

  return {
    proposals:
      results.flatMap(
        (result) =>
          result.proposals,
      ),

    standards:
      results.flatMap(
        (result) =>
          result.standards,
      ),
  };
}
