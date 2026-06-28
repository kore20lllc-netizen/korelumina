import type {
  ContextDocument,
} from "../context/ContextDocument.js";

import type {
  LearningEvent,
} from "./LearningEvent.js";

import {
  runLearningPipeline,
} from "./LearningPipeline.js";

export function learnFromContext(
  document: ContextDocument,
) {
  const events: LearningEvent[] =
    document.sections.map(
      (section) => ({
        id: section.id,
        type: "implementation",
        title: section.title,
        summary: section.content,
        source: section.source,
        metadata: {
          ...section.metadata,
        },
        occurredAt:
          document.createdAt,
      }),
    );

  return runLearningPipeline(
    events,
  );
}
