import type {
  AutonomousImprovementProvider,
} from "./AutonomousImprovementProvider.js";

import {
  autonomousImprovementProviderRegistry,
} from "./AutonomousImprovementProviderRegistry.js";

export function getAutonomousImprovementProvider(
  providerId: string,
): AutonomousImprovementProvider | undefined {
  return autonomousImprovementProviderRegistry.getAutonomousImprovementProvider(
    providerId,
  );
}
