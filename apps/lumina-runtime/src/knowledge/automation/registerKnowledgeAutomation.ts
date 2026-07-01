import {
  initializeKnowledgePublisher,
  registerKnowledgeSubscriber,
} from "@korelumina/platform-sdk";

import {
  EventJournalSubscriber,
} from "../event-journal/index.js";

let initialized = false;

export function registerKnowledgeAutomation() {
  if (initialized) {
    return;
  }

  initializeKnowledgePublisher();

  registerKnowledgeSubscriber(
    new EventJournalSubscriber(),
  );

  initialized = true;
}
