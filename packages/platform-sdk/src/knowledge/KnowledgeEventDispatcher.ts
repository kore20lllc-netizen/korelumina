import type {
  KnowledgeEvent,
} from "./KnowledgeEvent.js";

import {
  getKnowledgeSubscribers,
} from "./KnowledgeSubscriberRegistry.js";

export interface KnowledgeSubscriberResult {
  subscriber: string;

  success: boolean;

  error?: unknown;
}

export async function dispatchKnowledgeEvent(
  event: KnowledgeEvent,
): Promise<KnowledgeSubscriberResult[]> {
  const results: KnowledgeSubscriberResult[] = [];

  const subscribers =
    getKnowledgeSubscribers(event);

  for (const subscriber of subscribers) {
    try {
      await subscriber.handle(event);

      results.push({
        subscriber:
          subscriber.constructor.name,
        success: true,
      });
    } catch (error) {
      results.push({
        subscriber:
          subscriber.constructor.name,
        success: false,
        error,
      });
    }
  }

  return results;
}
