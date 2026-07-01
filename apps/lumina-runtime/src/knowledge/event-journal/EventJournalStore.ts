import {
  FileStore,
  JsonStore,
} from "../index.js";

import {
  getKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

const fileStore =
  new FileStore(
    `${getKnowledgeRoot()}/event-journal`,
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

export function appendEventJournalEntry(
  entry: EventJournalEntry,
) {
  jsonStore.write(
    `${entry.timestamp}-${entry.id}.json`,
    entry,
  );
}

export function listEventJournalEntries(): string[] {
  return jsonStore.list();
}
