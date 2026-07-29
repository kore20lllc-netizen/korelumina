import type {
  ExecutiveRecommendation,
} from "./ExecutiveRecommendationEngine.js";

export type ExecutiveExecutionAction =
  | "execute"
  | "schedule"
  | "monitor"
  | "defer";

export interface ExecutiveExecutionDecision {

  readonly recommendationId: string;

  readonly action:
    ExecutiveExecutionAction;

  readonly reason: string;

  readonly priority:
    ExecutiveRecommendation["priority"];
}

export class ExecutiveDecisionEngine {

  decide(
    recommendations:
      readonly ExecutiveRecommendation[],
  ): readonly ExecutiveExecutionDecision[] {

    return Object.freeze(

      recommendations.map(
        (recommendation) => {

          let action:
            ExecutiveExecutionAction;

          switch (
            recommendation.priority
          ) {

            case "critical":
              action = "execute";
              break;

            case "high":
              action = "schedule";
              break;

            case "medium":
              action = "monitor";
              break;

            default:
              action = "defer";
          }

          return Object.freeze({

            recommendationId:
              recommendation.id,

            action,

            priority:
              recommendation.priority,

            reason:
              `Decision generated from ${recommendation.priority} priority recommendation.`,
          });
        },
      ),
    );
  }
}

export function
createExecutiveDecisionEngine() {

  return new ExecutiveDecisionEngine();
}
