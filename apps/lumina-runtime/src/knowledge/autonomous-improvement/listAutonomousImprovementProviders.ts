import type {
  AutonomousImprovementProvider,
} from "./AutonomousImprovementProvider.js";

import {
  autonomousImprovementProviderRegistry,
} from "./AutonomousImprovementProviderRegistry.js";

export function listAutonomousImprovementProviders(): readonly AutonomousImprovementProvider[] {
  return autonomousImprovementProviderRegistry.listAutonomousImprovementProviders();
}
