import {
  registerKnowledgeProcessor,
} from "./KnowledgeProcessorRegistry.js";

import {
  StorageProcessor,
} from "./processors/StorageProcessor.js";

import {
  DecisionStorageProcessor,
} from "./processors/DecisionStorageProcessor.js";

let initialized = false;

export function initializeKnowledgePublisher() {
  if (initialized) {
    return;
  }

  registerKnowledgeProcessor(
    new StorageProcessor(),
  );

  registerKnowledgeProcessor(
    new DecisionStorageProcessor(),
  );

  initialized = true;
}
