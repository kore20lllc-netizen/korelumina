import type {
  EngineeringExecution,
} from "../execution/index.js";

import type {
  EngineeringPlan,
} from "./EngineeringPlan.js";

export interface PlannedEngineeringExecution {
  execution: EngineeringExecution;
  plan: EngineeringPlan;
}
