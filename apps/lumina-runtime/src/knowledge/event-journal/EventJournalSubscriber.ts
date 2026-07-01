import type {
  KnowledgeEvent,
  KnowledgeSubscriber,
} from "@korelumina/platform-sdk";

import {
  appendEventJournalEntry,
} from "./EventJournalStore.js";

import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

export class EventJournalSubscriber
  implements KnowledgeSubscriber {

  supports(
    _event: KnowledgeEvent,
  ): boolean {
    return true;
  }

  async handle(
    event: KnowledgeEvent,
  ): Promise<void> {
    const entry: EventJournalEntry = {
      id: [
        event.type,
        event.object.type,
        event.object.id,
        event.timestamp,
      ].join(":"),

      eventId:
        event.id,

      eventType:
        event.type,

      objectType:
        event.object.type,

      objectId:
        event.object.id,

      timestamp:
        event.timestamp,

      payload:
        event,
    };

    appendEventJournalEntry(
      entry,
    );
  }
}
