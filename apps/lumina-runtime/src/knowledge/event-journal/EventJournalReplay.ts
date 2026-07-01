import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

import {
  listEventJournalEntryRecords,
} from "./EventJournalQuery.js";

export interface EventJournalReplayHandler {
  supports(
    entry: EventJournalEntry,
  ): boolean;

  handle(
    entry: EventJournalEntry,
  ): Promise<void>;
}

export async function replayEventJournal(
  handlers: EventJournalReplayHandler[],
): Promise<void> {
  const entries =
    listEventJournalEntryRecords();

  for (const entry of entries) {
    for (const handler of handlers) {
      if (!handler.supports(entry)) {
        continue;
      }

      await handler.handle(entry);
    }
  }
}
