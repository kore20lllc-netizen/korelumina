import type {
  AutonomousImprovementProvider,
} from "./AutonomousImprovementProvider.js";

import {
  autonomousImprovementProviderRegistry,
} from "./AutonomousImprovementProviderRegistry.js";

export function registerAutonomousImprovementProvider(
  provider: AutonomousImprovementProvider,
): void {
  autonomousImprovementProviderRegistry.registerAutonomousImprovementProvider(
    provider,
  );
}
