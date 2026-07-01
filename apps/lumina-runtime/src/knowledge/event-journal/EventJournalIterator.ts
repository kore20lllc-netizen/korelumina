import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

import {
  listEventJournalEntryRecords,
} from "./EventJournalQuery.js";

export function* iterateEventJournal(): Generator<EventJournalEntry> {
  for (const entry of listEventJournalEntryRecords()) {
    yield entry;
  }
}
