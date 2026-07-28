import {
  KNOWLEDGE_PACKAGES,
} from "../data/knowledgePackages";

import type {
  PipelineEvent,
} from "../events/pipelineEvents";

export function projectPipelineState(
  events: readonly PipelineEvent[],
) {
  return {
    packages: KNOWLEDGE_PACKAGES,
    lastEvent:
      events.length === 0
        ? null
        : events[events.length - 1],
  };
}
