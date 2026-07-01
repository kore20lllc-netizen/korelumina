import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

import type {
  KnowledgeProcessor,
} from "./KnowledgeProcessor.js";

const processors: KnowledgeProcessor[] = [];

export function registerKnowledgeProcessor(
  processor: KnowledgeProcessor,
) {
  processors.push(processor);
}

export function listKnowledgeProcessors() {
  return [...processors];
}

export function getKnowledgeProcessors(
  object: KnowledgeObject,
) {
  return processors.filter(
    (processor) =>
      processor.supports(object),
  );
}
