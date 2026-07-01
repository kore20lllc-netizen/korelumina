import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

import {
  publishKnowledgeEvent,
} from "./KnowledgeEventBus.js";

import {
  getKnowledgeProcessors,
} from "./KnowledgeProcessorRegistry.js";

function createKnowledgeEventId(
  object: KnowledgeObject,
) {
  return [
    object.type,
    object.id,
    Date.now(),
  ].join(":");
}

export async function runKnowledgePipeline(
  object: KnowledgeObject,
): Promise<void> {
  const processors =
    getKnowledgeProcessors(object);

  for (const processor of processors) {
    await processor.process(
      object,
    );
  }

  await publishKnowledgeEvent({
    id: createKnowledgeEventId(
      object,
    ),
    type: "knowledge.published",
    object,
    timestamp: Date.now(),
    metadata: {},
  });
}
