import type {
  PlanningProvider,
} from "./PlanningProvider.js";

import {
  planningProviderRegistry,
} from "./PlanningProviderRegistry.js";

export function listPlanningProviders(): readonly PlanningProvider[] {
  return planningProviderRegistry.listPlanningProviders();
}
