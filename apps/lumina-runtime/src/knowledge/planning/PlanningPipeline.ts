import type {
  PlanningInput,
} from "./PlanningInput.js";

import type {
  PlanningPlan,
} from "./PlanningPlan.js";

import {
  listPlanningProviders,
} from "./listPlanningProviders.js";

export interface PlanningPipelineResult {
  plans: PlanningPlan[];
}

export async function runPlanningPipeline(
  input: PlanningInput,
): Promise<PlanningPipelineResult> {
  const providers =
    listPlanningProviders();

  const results =
    await Promise.all(
      providers.map(
        (provider) =>
          provider.plan(input),
      ),
    );

  return {
    plans:
      results.flatMap(
        (result) =>
          result.plans,
      ),
  };
}
