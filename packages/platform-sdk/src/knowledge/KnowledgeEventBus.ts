import type {
  KnowledgeEvent,
} from "./KnowledgeEvent.js";

import {
  dispatchKnowledgeEvent,
} from "./KnowledgeEventDispatcher.js";

export async function publishKnowledgeEvent(
  event: KnowledgeEvent,
): Promise<void> {
  await dispatchKnowledgeEvent(
    event,
  );
}
