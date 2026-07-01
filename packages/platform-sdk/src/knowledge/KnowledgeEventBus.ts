import type {
  KnowledgeEvent,
} from "./KnowledgeEvent.js";

import {
  getKnowledgeSubscribers,
} from "./KnowledgeSubscriberRegistry.js";

export async function publishKnowledgeEvent(
  event: KnowledgeEvent,
): Promise<void> {
  const subscribers =
    getKnowledgeSubscribers(event);

  for (const subscriber of subscribers) {
    await subscriber.handle(
      event,
    );
  }
}
