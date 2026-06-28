import type {
  PlanningPlan,
} from "../planning/PlanningPlan.js";

import type {
  EngineerAgentInput,
} from "./EngineerAgentInput.js";

export interface EngineerAgentPlanningAdapterInput {
  requestId: string;

  planningOutputId: string;

  plans: PlanningPlan[];

  objective: string;

  references: string[];
}

export function adaptPlanningOutputToEngineerAgentInput(
  input: EngineerAgentPlanningAdapterInput,
): EngineerAgentInput {
  return {
    requestId:
      input.requestId,

    planningOutputId:
      input.planningOutputId,

    planIds:
      input.plans.map(
        (plan) =>
          plan.id,
      ),

    objective:
      input.objective,

    references:
      input.references,
  };
}
