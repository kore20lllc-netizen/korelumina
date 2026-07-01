import type {
  EventJournalEntry,
} from "../event-journal/EventJournalEntry.js";

import type {
  EventJournalProjection,
} from "../event-journal/EventJournalProjection.js";

import {
  loadMilestone,
  saveMilestone,
} from "./MilestoneStore.js";

export class MilestoneProjection
  implements EventJournalProjection {
  name = "milestone-projection";

  supports(
    entry: EventJournalEntry,
  ): boolean {
    return (
      entry.objectType ===
      "milestone"
    );
  }

  async project(
    entry: EventJournalEntry,
  ): Promise<void> {
    const object =
      entry.payload.object;

    const existing =
      loadMilestone(
        object.id,
      );

    saveMilestone({
      id: object.id,
      title:
        String(
          object.metadata.title ??
            existing?.title ??
            object.id,
        ),
      description:
        String(
          object.metadata.description ??
            existing?.description ??
            "",
        ),
      phase:
        typeof object.metadata.phase ===
        "number"
          ? object.metadata.phase
          : existing?.phase,
      status:
        object.status === "active"
          ? "active"
          : object.status === "archived"
            ? "completed"
            : existing?.status ??
              "completed",
      commit:
        String(
          object.metadata.commit ??
            existing?.commit ??
            "",
        ),
      tag:
        typeof object.metadata.tag ===
        "string"
          ? object.metadata.tag
          : existing?.tag,
      adrIds:
        Array.isArray(
          object.metadata.adrIds,
        )
          ? object.metadata.adrIds.map(String)
          : existing?.adrIds ?? [],
      engineeringTicketIds:
        Array.isArray(
          object.metadata.engineeringTicketIds,
        )
          ? object.metadata.engineeringTicketIds.map(String)
          : existing?.engineeringTicketIds ?? [],
      decisionIds:
        Array.isArray(
          object.metadata.decisionIds,
        )
          ? object.metadata.decisionIds.map(String)
          : existing?.decisionIds ?? [],
      runtimeEventIds:
        Array.isArray(
          object.metadata.runtimeEventIds,
        )
          ? object.metadata.runtimeEventIds.map(String)
          : existing?.runtimeEventIds ?? [],
      startedAt:
        typeof object.metadata.startedAt ===
        "number"
          ? object.metadata.startedAt
          : existing?.startedAt ??
            object.createdAt,
      completedAt:
        typeof object.metadata.completedAt ===
        "number"
          ? object.metadata.completedAt
          : existing?.completedAt ??
            object.updatedAt,
      validated:
        typeof object.metadata.validated ===
        "boolean"
          ? object.metadata.validated
          : existing?.validated ??
            true,
    });
  }
}
