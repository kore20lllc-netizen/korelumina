import {
  listEventJournalEntries,
  loadEventJournalEntry,
} from "./EventJournalStore.js";

import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

export function listEventJournalEntryFiles(): string[] {
  return listEventJournalEntries()
    .filter((file) =>
      file.endsWith(".json"),
    )
    .sort();
}

export function listEventJournalEntryRecords(): EventJournalEntry[] {
  return listEventJournalEntryFiles()
    .map((file) =>
      loadEventJournalEntry(file),
    )
    .filter(
      (entry): entry is EventJournalEntry =>
        entry !== null,
    )
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp,
    );
}
