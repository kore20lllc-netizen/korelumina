import type {
  EventJournalEntry,
} from "./EventJournalEntry.js";

import type {
  EventJournalProjection,
} from "./EventJournalProjection.js";

const projections: EventJournalProjection[] = [];

export function registerEventJournalProjection(
  projection: EventJournalProjection,
) {
  projections.push(
    projection,
  );
}

export function listEventJournalProjections() {
  return [
    ...projections,
  ];
}

export function getEventJournalProjections(
  entry: EventJournalEntry,
) {
  return projections.filter(
    (projection) =>
      projection.supports(entry),
  );
}
