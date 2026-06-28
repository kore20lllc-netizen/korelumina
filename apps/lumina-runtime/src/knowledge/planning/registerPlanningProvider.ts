import type {
  PlanningProvider,
} from "./PlanningProvider.js";

import {
  planningProviderRegistry,
} from "./PlanningProviderRegistry.js";

export function registerPlanningProvider(
  provider: PlanningProvider,
): void {
  planningProviderRegistry.registerPlanningProvider(
    provider,
  );
}
