import {
  registerKnowledgeProcessor,
} from "./KnowledgeProcessorRegistry.js";

import {
  StorageProcessor,
} from "./processors/StorageProcessor.js";

let initialized = false;

export function initializeKnowledgePublisher() {
  if (initialized) {
    return;
  }

  registerKnowledgeProcessor(
    new StorageProcessor(),
  );

  initialized = true;
}
