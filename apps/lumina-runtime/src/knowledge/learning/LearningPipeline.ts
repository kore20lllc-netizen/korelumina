import {
  getLearningProviders,
} from "./LearningProviderRegistry.js";

import type {
  LearningEvent,
} from "./LearningEvent.js";

import type {
  LearningInsight,
} from "./LearningInsight.js";

import type {
  LearningPattern,
} from "./LearningPattern.js";

export interface LearningPipelineResult {
  patterns: LearningPattern[];

  insights: LearningInsight[];

  providerCount: number;
}

export function runLearningPipeline(
  events: readonly LearningEvent[],
): LearningPipelineResult {
  const providers =
    getLearningProviders();

  const results =
    providers.map((provider) =>
      provider.learn(events),
    );

  return {
    patterns:
      results.flatMap(
        (result) =>
          result.patterns,
      ),

    insights:
      results.flatMap(
        (result) =>
          result.insights,
      ),

    providerCount:
      providers.length,
  };
}
