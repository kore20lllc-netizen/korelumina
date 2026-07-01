import type {
  KnowledgeEvent,
} from "./KnowledgeEvent.js";

import type {
  KnowledgeSubscriber,
} from "./KnowledgeSubscriber.js";

const subscribers: KnowledgeSubscriber[] = [];

export function registerKnowledgeSubscriber(
  subscriber: KnowledgeSubscriber,
) {
  subscribers.push(subscriber);
}

export function listKnowledgeSubscribers() {
  return [...subscribers];
}

export function getKnowledgeSubscribers(
  event: KnowledgeEvent,
) {
  return subscribers.filter(
    (subscriber) =>
      subscriber.supports(event),
  );
}
