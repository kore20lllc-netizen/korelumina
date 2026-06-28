import type { PlanningStep } from "./PlanningStep.js";

export interface PlanningPlan {
  id: string;
  title: string;
  objective: string;
  steps: PlanningStep[];
  references: string[];
}
