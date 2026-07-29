import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

export interface ExecutiveHealthAssessment {

  readonly overallHealth: number;

  readonly executiveReadiness: number;

  readonly executiveConfidence: number;

  readonly executiveRisk: number;

  readonly executivePerformance: number;

  readonly executiveIntelligence: number;

  readonly executiveMaturity: number;
}

export class ExecutiveHealthEngine {

  assess(
    capabilities:
      readonly ExecutiveCapabilitySummary[],
  ): ExecutiveHealthAssessment {

    if (capabilities.length === 0) {

      return Object.freeze({

        overallHealth: 100,

        executiveReadiness: 100,

        executiveConfidence: 100,

        executiveRisk: 0,

        executivePerformance: 100,

        executiveIntelligence: 100,

        executiveMaturity: 100,
      });
    }

    const totalWeight =
      capabilities.reduce(
        (sum, capability) =>
          sum + capability.weight,
        0,
      );

    const weightedScore =
      capabilities.reduce(
        (sum, capability) =>
          sum +
          capability.score *
            capability.weight,
        0,
      );

    const health =
      Math.round(
        weightedScore /
        Math.max(totalWeight, 1),
      );

    return Object.freeze({

      overallHealth:
        health,

      executiveReadiness:
        health,

      executiveConfidence:
        Math.min(
          100,
          health + 5,
        ),

      executiveRisk:
        Math.max(
          0,
          100 - health,
        ),

      executivePerformance:
        health,

      executiveIntelligence:
        health,

      executiveMaturity:
        health,
    });
  }
}

export function
createExecutiveHealthEngine() {

  return new ExecutiveHealthEngine();
}
