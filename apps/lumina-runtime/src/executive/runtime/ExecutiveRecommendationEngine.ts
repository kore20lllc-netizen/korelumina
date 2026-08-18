import type {
  ExecutiveScorecard,
} from "./ExecutiveScoringEngine.js";

export type ExecutiveRecommendationPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface ExecutiveRecommendation {

  readonly id: string;

  readonly title: string;

  readonly description: string;

  readonly priority:
    ExecutiveRecommendationPriority;

  readonly category: string;
}

export class ExecutiveRecommendationEngine {

  generate(
    scorecard: ExecutiveScorecard,
  ): readonly ExecutiveRecommendation[] {

    const recommendations:
      ExecutiveRecommendation[] = [];

    if (scorecard.risk >= 70) {

      recommendations.push({

        id: "reduce-risk",

        title:
          "Reduce Executive Risk",

        description:
          "Investigate degraded executive capabilities and stabilize runtime health.",

        priority:
          "critical",

        category:
          "risk",
      });
    }

    if (
      scorecard.performance < 80
    ) {

      recommendations.push({

        id: "improve-performance",

        title:
          "Improve Performance",

        description:
          "Prioritize optimization initiatives to improve executive performance.",

        priority:
          "high",

        category:
          "performance",
      });
    }

    if (
      scorecard.maturity < 85
    ) {

      recommendations.push({

        id: "increase-maturity",

        title:
          "Increase Maturity",

        description:
          "Strengthen governance, automation, and operational consistency.",

        priority:
          "medium",

        category:
          "governance",
      });
    }

    if (
      recommendations.length === 0
    ) {

      recommendations.push({

        id: "maintain",

        title:
          "Maintain Executive Health",

        description:
          "Continue monitoring executive capabilities and preserve current operational excellence.",

        priority:
          "low",

        category:
          "operations",
      });
    }

    return Object.freeze(
      recommendations,
    );
  }
}

export function
createExecutiveRecommendationEngine() {

  return new ExecutiveRecommendationEngine();
}
