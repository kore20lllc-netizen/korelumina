import type {
  AutonomousImprovementInput,
} from "./AutonomousImprovementInput.js";

import type {
  EngineeringStandardUpdate,
} from "./EngineeringStandardUpdate.js";

import type {
  ImprovementProposal,
} from "./ImprovementProposal.js";

export interface AutonomousImprovementProviderResult {
  proposals: ImprovementProposal[];

  standards: EngineeringStandardUpdate[];
}

export interface AutonomousImprovementProvider {
  id: string;

  improve(
    input: AutonomousImprovementInput,
  ): Promise<AutonomousImprovementProviderResult>;
}
