import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

import {
  getKnowledgeProcessors,
} from "./KnowledgeProcessorRegistry.js";

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
}
