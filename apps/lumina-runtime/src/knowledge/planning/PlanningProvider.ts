import type { PlanningInput } from "./PlanningInput.js";
import type { PlanningPlan } from "./PlanningPlan.js";

export interface PlanningProviderResult {
  plans: PlanningPlan[];
}

export interface PlanningProvider {
  id: string;
  plan(input: PlanningInput): Promise<PlanningProviderResult>;
}
