import type {
  EngineeringExecution,
} from "./execution/index.js";

import {
  createEngineeringPlan,
} from "./planning/index.js";

export async function executeEngineering(
  execution: EngineeringExecution,
): Promise<EngineeringExecution> {
  const plan =
    await createEngineeringPlan(
      execution,
    );

  return {
    ...execution,
    updatedAt: Date.now(),
    metadata: {
      ...execution.metadata,
      engineeringPlan: plan,
    },
  };
}
