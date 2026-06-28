import type {
  PlanningProvider,
} from "./PlanningProvider.js";

import {
  planningProviderRegistry,
} from "./PlanningProviderRegistry.js";

export function getPlanningProvider(
  providerId: string,
): PlanningProvider | undefined {
  return planningProviderRegistry.getPlanningProvider(
    providerId,
  );
}
