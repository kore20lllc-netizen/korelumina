import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

import {
  listEventJournalEntryRecords,
} from "./EventJournalQuery.js";

import {
  runEventJournalReplayExecution,
} from "./EventJournalReplayExecution.js";

export interface EventJournalReplayHandler {
  supports(
    entry: EventJournalEntry,
  ): boolean;

  handle(
    entry: EventJournalEntry,
  ): Promise<void>;
}

export async function replayEventJournal(
  handlers: EventJournalReplayHandler[] = [],
): Promise<void> {
  const entries =
    listEventJournalEntryRecords();

  for (const entry of entries) {
    await runEventJournalReplayExecution(
      entry,
      handlers,
    );
  }
}
