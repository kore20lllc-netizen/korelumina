import type {
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  createChronologicalRelationship,
  createHistoricalEvent,
  createHistoricalRelationship,
  createHistoricalSourceReference,
} from "./GenesisHistoricalCorrelation.js";

import type {
  CurrentAuthorityStatus,
  GenesisHistoricalCorrelationState,
  HistoricalAuthorityStatus,
  HistoricalEvent,
  HistoricalEventKind,
  HistoricalSourceReference,
  TemporalAuthority,
} from "./GenesisHistoricalCorrelation.js";

function stringMetadata(
  entry:
    GenesisSourceManifestEntry,

  key:
    string,
): string | undefined {
  const value =
    entry.metadata[
      key
    ];

  return typeof value ===
    "string" &&
    value.trim()
      ? value.trim()
      : undefined;
}

function historicalStatus(
  entry:
    GenesisSourceManifestEntry,
): HistoricalAuthorityStatus {
  const approval =
    entry.approvalState
      ?.toLowerCase();

  if (
    approval?.includes(
      "reject",
    )
  ) {
    return "historically-rejected";
  }

  if (
    approval?.includes(
      "validat",
    ) ||
    approval?.includes(
      "certif",
    )
  ) {
    return "historically-validated";
  }

  if (
    approval?.includes(
      "approv",
    )
  ) {
    return "historically-authoritative";
  }

  if (
    approval?.includes(
      "implement",
    )
  ) {
    return "historically-implemented";
  }

  if (
    approval?.includes(
      "propos",
    )
  ) {
    return "historically-proposed";
  }

  return "historically-observed";
}

function currentStatus():
  CurrentAuthorityStatus {
  /*
   * Historical replay cannot infer present-day authority
   * merely from historical observation.
   */
  return "unknown";
}

function temporalAuthority(
  entry:
    GenesisSourceManifestEntry,
): TemporalAuthority {
  return {
    historical: {
      status:
        historicalStatus(
          entry,
        ),

      authorityClass:
        entry.authorityClass,

      approvalState:
        entry.approvalState,

      effectiveFrom:
        entry.effectiveFrom
          ? Date.parse(
              entry.effectiveFrom,
            )
          : undefined,

      effectiveTo:
        entry.effectiveTo
          ? Date.parse(
              entry.effectiveTo,
            )
          : undefined,
    },

    current: {
      status:
        currentStatus(),

      authorityClass:
        entry.authorityClass,

      approvalState:
        entry.approvalState,
    },
  };
}

function eventKind(
  entry:
    GenesisSourceManifestEntry,
): HistoricalEventKind {
  switch (
    entry.sourceType
  ) {
    case "commit":
      return "implementation-committed";

    case "build-output":
      return "build-executed";

    case "runtime-event":
      return "runtime-observed";

    case "milestone":
      return "release-certified";

    case "ADR":
    case "RFC":
    case "architecture-document":
    case "document":
    case "specification":
    case "roadmap":
      return "document-created";

    default:
      return "other";
  }
}

function sourceIdentity(
  entry:
    GenesisSourceManifestEntry,
): string {
  return (
    stringMetadata(
      entry,
      "sourceIdentity",
    ) ??
    stringMetadata(
      entry,
      "path",
    ) ??
    stringMetadata(
      entry,
      "subject",
    ) ??
    entry.historicalSourceId
  );
}

function eventSummary(
  entry:
    GenesisSourceManifestEntry,
): string {
  return (
    stringMetadata(
      entry,
      "subject",
    ) ??
    stringMetadata(
      entry,
      "title",
    ) ??
    stringMetadata(
      entry,
      "path",
    ) ??
    entry.provenanceLocator
  );
}

function buildSourceReference(
  entry:
    GenesisSourceManifestEntry,
): HistoricalSourceReference {
  const externalSource =
    entry.sourceType ===
      "conversation" ||
    entry.metadata[
      "externalSource"
    ] === true;

  return createHistoricalSourceReference({
    sourceIdentity:
      sourceIdentity(
        entry,
      ),

    sourceClass:
      entry.sourceType,

    evidenceType:
      entry.evidenceType,

    sourceRevision:
      entry.sourceChecksum,

    provenance: {
      locator:
        entry.provenanceLocator,

      nativeId:
        stringMetadata(
          entry,
          "nativeId",
        ),

      repository:
        stringMetadata(
          entry,
          "repository",
        ),

      ref:
        stringMetadata(
          entry,
          "ref",
        ),

      sourceReference:
        stringMetadata(
          entry,
          "sourceReference",
        ),

      externalSource,
    },

    integrity: {
      checksum:
        entry.sourceChecksum,

      acquisitionState:
        externalSource
          ? "not-yet-ingested"
          : "acquired",

      acquiredAt:
        entry.discoveredAt,
    },

    metadata: {
      historicalSourceId:
        entry.historicalSourceId,

      authorityOwner:
        entry.authorityOwner,

      authorityScope:
        entry.authorityScope,

      authorityVersion:
        entry.authorityVersion,

      discoveryMethod:
        entry.discoveryMethod,

      historicalTimestampSource:
        entry.historicalTimestampSource,

      ...entry.metadata,
    },
  });
}

function buildEvent(
  entry:
    GenesisSourceManifestEntry,

  source:
    HistoricalSourceReference,
): HistoricalEvent {
  return createHistoricalEvent({
    kind:
      eventKind(
        entry,
      ),

    observationKey:
      entry.historicalSourceId,

    occurredAt:
      entry.historicalTimestamp,

    sourceReferenceIds: [
      source.sourceReferenceId,
    ],

    sourceRevisionIds: [
      source.sourceRevisionId,
    ],

    summary:
      eventSummary(
        entry,
      ),

    temporalAuthority:
      temporalAuthority(
        entry,
      ),

    metadata: {
      historicalSourceId:
        entry.historicalSourceId,

      sourceType:
        entry.sourceType,

      evidenceType:
        entry.evidenceType,
    },
  });
}

export function materializeGenesisHistoricalCorrelation(
  execution:
    GenesisReplayExecution,
): GenesisHistoricalCorrelationState {
  const admittedSourceIds =
    new Set(
      execution.state
        .dispositions
        .filter(
          disposition =>
            disposition.disposition ===
            "ADMITTED",
        )
        .map(
          disposition =>
            disposition.historicalSourceId,
        ),
    );

  const admittedEntries =
    execution.manifest.entries
      .filter(
        entry =>
          admittedSourceIds.has(
            entry.historicalSourceId,
          ),
      );

  const sourceByHistoricalId =
    new Map<
      string,
      HistoricalSourceReference
    >();

  const eventByHistoricalId =
    new Map<
      string,
      HistoricalEvent
    >();

  for (
    const entry
    of admittedEntries
  ) {
    const source =
      buildSourceReference(
        entry,
      );

    const event =
      buildEvent(
        entry,
        source,
      );

    sourceByHistoricalId.set(
      entry.historicalSourceId,
      source,
    );

    eventByHistoricalId.set(
      entry.historicalSourceId,
      event,
    );
  }

  const relationships = [];

  /*
   * Only explicit manifest relationships are projected
   * semantically. No inferred causality is introduced.
   */
  for (
    const entry
    of admittedEntries
  ) {
    const source =
      sourceByHistoricalId.get(
        entry.historicalSourceId,
      );

    if (
      !source
    ) {
      continue;
    }

    for (
      const supersededId
      of entry.supersedes
    ) {
      const superseded =
        sourceByHistoricalId.get(
          supersededId,
        );

      if (
        !superseded
      ) {
        continue;
      }

      relationships.push(
        createHistoricalRelationship({
          from: {
            kind:
              "source",

            id:
              superseded.sourceReferenceId,
          },

          to: {
            kind:
              "source",

            id:
              source.sourceReferenceId,
          },

          type:
            "superseded_by",

          causal:
            false,

          confidence:
            "explicit",

          evidence: {
            mode:
              "explicit-reference",

            confidence:
              "explicit",

            sourceReferenceIds: [
              superseded.sourceReferenceId,
              source.sourceReferenceId,
            ],

            assertions: [
              `Manifest ${entry.historicalSourceId} explicitly supersedes ${supersededId}.`,
            ],
          },
        }),
      );
    }

    for (
      const conflictId
      of entry.conflictsWith
    ) {
      const conflict =
        sourceByHistoricalId.get(
          conflictId,
        );

      if (
        !conflict
      ) {
        continue;
      }

      relationships.push(
        createHistoricalRelationship({
          from: {
            kind:
              "source",

            id:
              source.sourceReferenceId,
          },

          to: {
            kind:
              "source",

            id:
              conflict.sourceReferenceId,
          },

          type:
            "contradicted_by",

          causal:
            false,

          confidence:
            "explicit",

          evidence: {
            mode:
              "explicit-reference",

            confidence:
              "explicit",

            sourceReferenceIds: [
              source.sourceReferenceId,
              conflict.sourceReferenceId,
            ],

            assertions: [
              `Manifest ${entry.historicalSourceId} explicitly conflicts with ${conflictId}.`,
            ],
          },
        }),
      );
    }
  }

  /*
   * Deterministic chronological ordering is allowed only
   * when the next timestamp is strictly greater.
   *
   * Equal timestamps do not imply ordering or causality.
   */
  const orderedEvents =
    admittedEntries
      .map(
        entry => ({
          entry,

          event:
            eventByHistoricalId.get(
              entry.historicalSourceId,
            ),
        }),
      )
      .filter(
        (
          value,
        ): value is {
          entry:
            GenesisSourceManifestEntry;

          event:
            HistoricalEvent;
        } =>
          Boolean(
            value.event,
          ),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.event.occurredAt -
            right.event.occurredAt ||
          left.event.eventId.localeCompare(
            right.event.eventId,
          ),
      );

  for (
    let index = 1;
    index <
      orderedEvents.length;
    index += 1
  ) {
    const previous =
      orderedEvents[
        index - 1
      ];

    const current =
      orderedEvents[
        index
      ];

    if (
      previous.event.occurredAt >=
      current.event.occurredAt
    ) {
      continue;
    }

    relationships.push(
      createChronologicalRelationship({
        fromEventId:
          previous.event.eventId,

        toEventId:
          current.event.eventId,

        sourceReferenceIds: [
          ...previous.event
            .sourceReferenceIds,
          ...current.event
            .sourceReferenceIds,
        ],

        assertion:
          `${previous.event.eventId} occurred before ${current.event.eventId} according to persisted historical timestamps.`,
      }),
    );
  }

  return {
    sourceReferences: [
      ...sourceByHistoricalId
        .values(),
    ],

    events: [
      ...eventByHistoricalId
        .values(),
    ],

    relationships,

    /*
     * Evolution Episodes require stronger semantic
     * correlation than replay membership alone.
     * Do not fabricate them.
     */
    episodes:
      [],
  };
}
