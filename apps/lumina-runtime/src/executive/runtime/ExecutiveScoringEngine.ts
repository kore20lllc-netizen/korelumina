import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

export interface ExecutiveScorecard {

  readonly overall: number;

  readonly readiness: number;

  readonly confidence: number;

  readonly intelligence: number;

  readonly performance: number;

  readonly maturity: number;

  readonly risk: number;

  readonly capabilityScores:
    Readonly<
      Record<string, number>
    >;
}

export class ExecutiveScoringEngine {

  score(
    capabilities:
      readonly ExecutiveCapabilitySummary[],
  ): ExecutiveScorecard {

    if (
      capabilities.length === 0
    ) {

      return Object.freeze({

        overall: 100,

        readiness: 100,

        confidence: 100,

        intelligence: 100,

        performance: 100,

        maturity: 100,

        risk: 0,

        capabilityScores:
          Object.freeze({}),
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

    const overall =
      Math.round(
        weightedScore /
        Math.max(
          totalWeight,
          1,
        ),
      );

    const capabilityScores =
      Object.freeze(
        Object.fromEntries(
          capabilities.map(
            (capability) => [
              capability.capability,
              capability.score,
            ],
          ),
        ),
      );

    return Object.freeze({

      overall,

      readiness:
        overall,

      confidence:
        Math.min(
          100,
          overall + 5,
        ),

      intelligence:
        overall,

      performance:
        overall,

      maturity:
        overall,

      risk:
        Math.max(
          0,
          100 - overall,
        ),

      capabilityScores,
    });
  }
}

export function
createExecutiveScoringEngine() {

  return new ExecutiveScoringEngine();
}
