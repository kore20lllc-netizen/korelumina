import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

export interface EventJournalProjection {
  name: string;

  supports(
    entry: EventJournalEntry,
  ): boolean;

  project(
    entry: EventJournalEntry,
  ): Promise<void>;
}
