import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

import {
  ExecutiveHealthEngine,
  type ExecutiveHealthAssessment,
} from "./ExecutiveHealthEngine.js";

import {
  ExecutiveScoringEngine,
  type ExecutiveScorecard,
} from "./ExecutiveScoringEngine.js";

import {
  ExecutiveRecommendationEngine,
  type ExecutiveRecommendation,
} from "./ExecutiveRecommendationEngine.js";

import {
  ExecutiveDecisionEngine,
  type ExecutiveExecutionDecision,
} from "./ExecutiveDecisionEngine.js";

export interface ExecutiveRuntimeResult {

  readonly health:
    ExecutiveHealthAssessment;

  readonly scorecard:
    ExecutiveScorecard;

  readonly recommendations:
    readonly ExecutiveRecommendation[];

  readonly decisions:
    readonly ExecutiveExecutionDecision[];
}

export class ExecutiveCoordinator {

  private readonly healthEngine =
    new ExecutiveHealthEngine();

  private readonly scoringEngine =
    new ExecutiveScoringEngine();

  private readonly recommendationEngine =
    new ExecutiveRecommendationEngine();

  private readonly decisionEngine =
    new ExecutiveDecisionEngine();

  evaluate(
    capabilities:
      readonly ExecutiveCapabilitySummary[],
  ): ExecutiveRuntimeResult {

    const health =
      this.healthEngine.assess(
        capabilities,
      );

    const scorecard =
      this.scoringEngine.score(
        capabilities,
      );

    const recommendations =
      this.recommendationEngine.generate(
        scorecard,
      );

    const decisions =
      this.decisionEngine.decide(
        recommendations,
      );

    return Object.freeze({

      health,

      scorecard,

      recommendations,

      decisions,
    });
  }
}

export function
createExecutiveCoordinator() {

  return new ExecutiveCoordinator();
}
