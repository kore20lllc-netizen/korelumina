import {
  createHash,
} from "node:crypto";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  EvolutionEpisodeId,
  HistoricalEvent,
  HistoricalEventId,
  HistoricalRelationship,
  HistoricalRelationshipId,
  HistoricalSourceReferenceId,
  HistoricalSourceRevisionId,
  TemporalAuthority,
} from "./GenesisHistoricalCorrelation.js";

export type GenesisTemporalChronologyProjectionId =
  `genesis-chronology:${string}`;

export type GenesisTemporalChronologyEntryId =
  `genesis-chronology-entry:${string}`;

export interface GenesisTemporalChronologyEntry {
  chronologyEntryId:
    GenesisTemporalChronologyEntryId;

  position:
    number;

  eventId:
    HistoricalEventId;

  occurredAt:
    number;

  kind:
    HistoricalEvent["kind"];

  summary:
    string | null;

  sourceReferenceIds:
    readonly HistoricalSourceReferenceId[];

  sourceRevisionIds:
    readonly HistoricalSourceRevisionId[];

  episodeIds:
    readonly EvolutionEpisodeId[];

  incomingRelationshipIds:
    readonly HistoricalRelationshipId[];

  outgoingRelationshipIds:
    readonly HistoricalRelationshipId[];

  chronologicalPredecessorEventIds:
    readonly HistoricalEventId[];

  chronologicalSuccessorEventIds:
    readonly HistoricalEventId[];

  temporalAuthority:
    TemporalAuthority;

  revisesEventId:
    HistoricalEventId | null;

  metadata:
    HistoricalEvent["metadata"];
}

export interface GenesisTemporalChronologyEqualTimestampGroup {
  occurredAt:
    number;

  eventIds:
    readonly HistoricalEventId[];
}

export interface GenesisTemporalChronologyAuthoritySummary {
  historicallyAuthoritative:
    number;

  historicallyProposed:
    number;

  historicallyRejected:
    number;

  historicallyImplemented:
    number;

  historicallyValidated:
    number;

  historicallyObserved:
    number;

  historicalUnknown:
    number;

  currentlyAuthoritative:
    number;

  currentlyImplemented:
    number;

  currentlySuperseded:
    number;

  currentlyRetired:
    number;

  currentNotApplicable:
    number;

  currentUnknown:
    number;
}

export interface GenesisTemporalChronologyCoverage {
  totalEvents:
    number;

  earliestOccurredAt:
    number | null;

  latestOccurredAt:
    number | null;

  equalTimestampGroups:
    readonly GenesisTemporalChronologyEqualTimestampGroup[];

  sourceRevisionsWithoutHistoricalEvents:
    readonly HistoricalSourceRevisionId[];

  episodesWithExternalContextPending:
    readonly EvolutionEpisodeId[];

  conflictedEpisodes:
    readonly EvolutionEpisodeId[];

  unresolvedRelationshipIds:
    readonly HistoricalRelationshipId[];

  complete:
    boolean;
}

export interface GenesisTemporalChronology {
  projectionId:
    GenesisTemporalChronologyProjectionId;

  corpusProjectionId:
    GenesisCorpusReadModel["projectionId"];

  entries:
    readonly GenesisTemporalChronologyEntry[];

  authority:
    GenesisTemporalChronologyAuthoritySummary;

  coverage:
    GenesisTemporalChronologyCoverage;
}

function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          (
            key,
          ) => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}

function hashIdentity(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}

function sortedUnique<
  T extends string,
>(
  values:
    readonly T[],
): readonly T[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}

function compareEvent(
  left:
    HistoricalEvent,

  right:
    HistoricalEvent,
): number {
  if (
    left.occurredAt !==
    right.occurredAt
  ) {
    return (
      left.occurredAt -
      right.occurredAt
    );
  }

  /*
   * Equal timestamps never imply causality.
   *
   * Stable event identity provides deterministic display/read
   * order only.
   */
  return left.eventId
    .localeCompare(
      right.eventId,
    );
}

function relationshipsForEvent(
  eventId:
    HistoricalEventId,

  relationships:
    readonly HistoricalRelationship[],
): {
  incoming:
    readonly HistoricalRelationship[];

  outgoing:
    readonly HistoricalRelationship[];
} {
  const incoming =
    relationships.filter(
      (
        relationship,
      ) =>
        relationship.to.kind ===
          "event" &&
        relationship.to.id ===
          eventId,
    );

  const outgoing =
    relationships.filter(
      (
        relationship,
      ) =>
        relationship.from.kind ===
          "event" &&
        relationship.from.id ===
          eventId,
    );

  return {
    incoming,
    outgoing,
  };
}

function episodeIdsForEvent(
  eventId:
    HistoricalEventId,

  corpus:
    GenesisCorpusReadModel,
): readonly EvolutionEpisodeId[] {
  return sortedUnique(
    corpus.episodes
      .filter(
        (
          episode,
        ) =>
          episode.eventIds
            .includes(
              eventId,
            ),
      )
      .map(
        (
          episode,
        ) =>
          episode.episodeId,
      ),
  );
}

function chronologyNeighbors(
  relationships:
    readonly HistoricalRelationship[],

  eventId:
    HistoricalEventId,
): {
  predecessorIds:
    readonly HistoricalEventId[];

  successorIds:
    readonly HistoricalEventId[];
} {
  const predecessorIds =
    relationships
      .filter(
        (
          relationship,
        ) =>
          relationship.type ===
            "occurred_before" &&
          relationship.to.kind ===
            "event" &&
          relationship.to.id ===
            eventId &&
          relationship.from.kind ===
            "event",
      )
      .map(
        (
          relationship,
        ) =>
          relationship.from.id as
            HistoricalEventId,
      );

  const successorIds =
    relationships
      .filter(
        (
          relationship,
        ) =>
          relationship.type ===
            "occurred_before" &&
          relationship.from.kind ===
            "event" &&
          relationship.from.id ===
            eventId &&
          relationship.to.kind ===
            "event",
      )
      .map(
        (
          relationship,
        ) =>
          relationship.to.id as
            HistoricalEventId,
      );

  return {
    predecessorIds:
      sortedUnique(
        predecessorIds,
      ),

    successorIds:
      sortedUnique(
        successorIds,
      ),
  };
}

function chronologyEntry(
  event:
    HistoricalEvent,

  position:
    number,

  corpus:
    GenesisCorpusReadModel,
): GenesisTemporalChronologyEntry {
  const relationships =
    relationshipsForEvent(
      event.eventId,
      corpus.relationships,
    );

  const neighbors =
    chronologyNeighbors(
      corpus.relationships,
      event.eventId,
    );

  const chronologyEntryId =
    `genesis-chronology-entry:${hashIdentity({
      eventId:
        event.eventId,
    })}` as GenesisTemporalChronologyEntryId;

  return {
    chronologyEntryId,

    position,

    eventId:
      event.eventId,

    occurredAt:
      event.occurredAt,

    kind:
      event.kind,

    summary:
      event.summary ??
      null,

    sourceReferenceIds:
      sortedUnique(
        event.sourceReferenceIds,
      ),

    sourceRevisionIds:
      sortedUnique(
        event.sourceRevisionIds,
      ),

    episodeIds:
      episodeIdsForEvent(
        event.eventId,
        corpus,
      ),

    incomingRelationshipIds:
      sortedUnique(
        relationships.incoming
          .map(
            (
              relationship,
            ) =>
              relationship
                .relationshipId,
          ),
      ),

    outgoingRelationshipIds:
      sortedUnique(
        relationships.outgoing
          .map(
            (
              relationship,
            ) =>
              relationship
                .relationshipId,
          ),
      ),

    chronologicalPredecessorEventIds:
      neighbors
        .predecessorIds,

    chronologicalSuccessorEventIds:
      neighbors
        .successorIds,

    temporalAuthority: {
      historical: {
        ...event
          .temporalAuthority
          .historical,
      },

      current: {
        ...event
          .temporalAuthority
          .current,
      },
    },

    revisesEventId:
      event.revisesEventId ??
      null,

    metadata: {
      ...event.metadata,
    },
  };
}

function equalTimestampGroups(
  events:
    readonly HistoricalEvent[],
): readonly GenesisTemporalChronologyEqualTimestampGroup[] {
  const grouped =
    new Map<
      number,
      HistoricalEventId[]
    >();

  for (
    const event
    of events
  ) {
    const eventIds =
      grouped.get(
        event.occurredAt,
      ) ??
      [];

    eventIds.push(
      event.eventId,
    );

    grouped.set(
      event.occurredAt,
      eventIds,
    );
  }

  return [
    ...grouped.entries(),
  ]
    .filter(
      (
        [
          ,
          eventIds,
        ],
      ) =>
        eventIds.length >
        1,
    )
    .map(
      (
        [
          occurredAt,
          eventIds,
        ],
      ) => ({
        occurredAt,

        eventIds:
          sortedUnique(
            eventIds,
          ),
      }),
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.occurredAt -
        right.occurredAt,
    );
}

function authoritySummary(
  events:
    readonly HistoricalEvent[],
): GenesisTemporalChronologyAuthoritySummary {
  const result:
    GenesisTemporalChronologyAuthoritySummary = {
      historicallyAuthoritative:
        0,

      historicallyProposed:
        0,

      historicallyRejected:
        0,

      historicallyImplemented:
        0,

      historicallyValidated:
        0,

      historicallyObserved:
        0,

      historicalUnknown:
        0,

      currentlyAuthoritative:
        0,

      currentlyImplemented:
        0,

      currentlySuperseded:
        0,

      currentlyRetired:
        0,

      currentNotApplicable:
        0,

      currentUnknown:
        0,
    };

  for (
    const event
    of events
  ) {
    switch (
      event
        .temporalAuthority
        .historical
        .status
    ) {
      case "historically-authoritative":
        result
          .historicallyAuthoritative +=
          1;
        break;

      case "historically-proposed":
        result
          .historicallyProposed +=
          1;
        break;

      case "historically-rejected":
        result
          .historicallyRejected +=
          1;
        break;

      case "historically-implemented":
        result
          .historicallyImplemented +=
          1;
        break;

      case "historically-validated":
        result
          .historicallyValidated +=
          1;
        break;

      case "historically-observed":
        result
          .historicallyObserved +=
          1;
        break;

      case "unknown":
        result
          .historicalUnknown +=
          1;
        break;
    }

    switch (
      event
        .temporalAuthority
        .current
        .status
    ) {
      case "currently-authoritative":
        result
          .currentlyAuthoritative +=
          1;
        break;

      case "currently-implemented":
        result
          .currentlyImplemented +=
          1;
        break;

      case "currently-superseded":
        result
          .currentlySuperseded +=
          1;
        break;

      case "currently-retired":
        result
          .currentlyRetired +=
          1;
        break;

      case "not-applicable":
        result
          .currentNotApplicable +=
          1;
        break;

      case "unknown":
        result
          .currentUnknown +=
          1;
        break;
    }
  }

  return result;
}

function coverage(
  corpus:
    GenesisCorpusReadModel,

  orderedEvents:
    readonly HistoricalEvent[],
): GenesisTemporalChronologyCoverage {
  const eventSourceRevisionIds =
    new Set<
      HistoricalSourceRevisionId
    >(
      orderedEvents.flatMap(
        (
          event,
        ) =>
          event.sourceRevisionIds,
      ),
    );

  const sourceRevisionsWithoutHistoricalEvents =
    corpus.sources
      .map(
        (
          source,
        ) =>
          source.sourceRevisionId,
      )
      .filter(
        (
          sourceRevisionId,
        ) =>
          !eventSourceRevisionIds
            .has(
              sourceRevisionId,
            ),
      )
      .sort();

  const episodesWithExternalContextPending =
    corpus.episodes
      .filter(
        (
          episode,
        ) =>
          episode.externalContext ===
          "pending",
      )
      .map(
        (
          episode,
        ) =>
          episode.episodeId,
      )
      .sort();

  const conflictedEpisodes =
    corpus.episodes
      .filter(
        (
          episode,
        ) =>
          episode.lifecycle ===
          "conflicted",
      )
      .map(
        (
          episode,
        ) =>
          episode.episodeId,
      )
      .sort();

  const unresolvedRelationshipIds =
    corpus.relationships
      .filter(
        (
          relationship,
        ) =>
          relationship.confidence ===
          "unresolved",
      )
      .map(
        (
          relationship,
        ) =>
          relationship
            .relationshipId,
      )
      .sort();

  return {
    totalEvents:
      orderedEvents.length,

    earliestOccurredAt:
      orderedEvents[0]
        ?.occurredAt ??
      null,

    latestOccurredAt:
      orderedEvents[
        orderedEvents.length -
          1
      ]?.occurredAt ??
      null,

    equalTimestampGroups:
      equalTimestampGroups(
        orderedEvents,
      ),

    sourceRevisionsWithoutHistoricalEvents,

    episodesWithExternalContextPending,

    conflictedEpisodes,

    unresolvedRelationshipIds,

    /*
     * This is chronology coverage only.
     *
     * It is NOT Genesis Corpus completion,
     * canonical readiness, or educational readiness.
     */
    complete:
      sourceRevisionsWithoutHistoricalEvents
        .length ===
        0 &&
      episodesWithExternalContextPending
        .length ===
        0 &&
      conflictedEpisodes
        .length ===
        0 &&
      unresolvedRelationshipIds
        .length ===
        0,
  };
}

export function buildGenesisTemporalChronology(
  corpus:
    GenesisCorpusReadModel,
): GenesisTemporalChronology {
  const orderedEvents =
    [
      ...corpus.events,
    ].sort(
      compareEvent,
    );

  const entries =
    orderedEvents.map(
      (
        event,
        index,
      ) =>
        chronologyEntry(
          event,
          index,
          corpus,
        ),
    );

  const chronologyCoverage =
    coverage(
      corpus,
      orderedEvents,
    );

  const authority =
    authoritySummary(
      orderedEvents,
    );

  const projectionId =
    `genesis-chronology:${hashIdentity({
      corpusProjectionId:
        corpus.projectionId,

      entries:
        entries.map(
          (
            entry,
          ) => ({
            chronologyEntryId:
              entry
                .chronologyEntryId,

            eventId:
              entry.eventId,

            occurredAt:
              entry.occurredAt,

            temporalAuthority:
              entry
                .temporalAuthority,

            revisesEventId:
              entry
                .revisesEventId,

            incomingRelationshipIds:
              entry
                .incomingRelationshipIds,

            outgoingRelationshipIds:
              entry
                .outgoingRelationshipIds,

            episodeIds:
              entry
                .episodeIds,
          }),
        ),

      coverage:
        chronologyCoverage,

      authority,
    })}` as GenesisTemporalChronologyProjectionId;

  return {
    projectionId,

    corpusProjectionId:
      corpus.projectionId,

    entries,

    authority,

    coverage:
      chronologyCoverage,
  };
}
