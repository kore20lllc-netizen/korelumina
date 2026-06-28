import type {
  LearningEvent,
} from "./LearningEvent.js";

import type {
  LearningInsight,
} from "./LearningInsight.js";

import type {
  LearningPattern,
} from "./LearningPattern.js";

export interface LearningProvider {
  readonly providerId: string;

  learn(
    events: readonly LearningEvent[],
  ): {
    patterns: LearningPattern[];
    insights: LearningInsight[];
  };
}
