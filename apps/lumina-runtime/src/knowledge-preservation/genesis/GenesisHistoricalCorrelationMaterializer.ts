import type {
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  createChronologicalRelationship,
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalRelationship,
  createHistoricalSourceReference,
} from "./GenesisHistoricalCorrelation.js";

import type {
  CurrentAuthorityStatus,
  EvolutionEpisode,
  GenesisHistoricalCorrelationState,
  HistoricalAuthorityStatus,
  HistoricalEvent,
  HistoricalEventKind,
  HistoricalRelationship,
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
  /*
   * A Git commit is itself the authoritative historical object.
   *
   * Commit subjects are descriptive labels, not logical Source
   * identities. Two independent commits may legitimately reuse
   * the same subject. Collapsing them by subject would fabricate
   * a revision relationship and can incorrectly materialize an
   * Evolution Episode.
   *
   * The Historical Source ID already embeds the deterministic
   * commit identity established by discovery.
   */
  if (
    entry.sourceType ===
    "commit"
  ) {
    return entry
      .historicalSourceId;
  }

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
        "acquired",

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

function materializeEvolutionEpisodes(
  input: {
    admittedEntries:
      readonly GenesisSourceManifestEntry[];

    sourceByHistoricalId:
      ReadonlyMap<
        string,
        HistoricalSourceReference
      >;

    eventByHistoricalId:
      ReadonlyMap<
        string,
        HistoricalEvent
      >;

    relationships:
      readonly HistoricalRelationship[];
  },
): readonly EvolutionEpisode[] {
  /*
   * Evolution Episodes require a semantic correlation signal.
   *
   * Allowed signals:
   * - multiple revisions of the same logical Source Reference;
   * - an explicit manifest supersedes relation;
   * - an explicit manifest conflict relation.
   *
   * Replay membership, timestamp proximity, and chronological
   * adjacency are explicitly insufficient.
   */

  const historicalIds =
    input.admittedEntries.map(
      entry =>
        entry.historicalSourceId,
    );

  const parent =
    new Map<
      string,
      string
    >(
      historicalIds.map(
        id => [
          id,
          id,
        ],
      ),
    );

  function find(
    id:
      string,
  ): string {
    const current =
      parent.get(
        id,
      );

    if (
      !current
    ) {
      throw new Error(
        "genesis_episode_materializer_unknown_source",
      );
    }

    if (
      current ===
      id
    ) {
      return id;
    }

    const root =
      find(
        current,
      );

    parent.set(
      id,
      root,
    );

    return root;
  }

  function union(
    left:
      string,

    right:
      string,
  ): void {
    if (
      !parent.has(
        left,
      ) ||
      !parent.has(
        right,
      )
    ) {
      return;
    }

    const leftRoot =
      find(
        left,
      );

    const rightRoot =
      find(
        right,
      );

    if (
      leftRoot ===
      rightRoot
    ) {
      return;
    }

    const [
      first,
      second,
    ] =
      [
        leftRoot,
        rightRoot,
      ].sort();

    parent.set(
      second,
      first,
    );
  }

  /*
   * Signal 1:
   * revisions of one stable logical Source Reference.
   */
  const historicalIdsBySourceReference =
    new Map<
      string,
      string[]
    >();

  for (
    const entry
    of input.admittedEntries
  ) {
    const source =
      input.sourceByHistoricalId.get(
        entry.historicalSourceId,
      );

    if (
      !source
    ) {
      continue;
    }

    const ids =
      historicalIdsBySourceReference.get(
        source.sourceReferenceId,
      ) ??
      [];

    ids.push(
      entry.historicalSourceId,
    );

    historicalIdsBySourceReference.set(
      source.sourceReferenceId,
      ids,
    );
  }

  for (
    const ids
    of historicalIdsBySourceReference.values()
  ) {
    if (
      ids.length <
      2
    ) {
      continue;
    }

    const first =
      ids[0];

    for (
      const id
      of ids.slice(
        1,
      )
    ) {
      union(
        first,
        id,
      );
    }
  }

  /*
   * Signals 2 and 3:
   * explicit semantic links in the manifest.
   */
  for (
    const entry
    of input.admittedEntries
  ) {
    for (
      const target
      of [
        ...entry.supersedes,
        ...entry.conflictsWith,
      ]
    ) {
      union(
        entry.historicalSourceId,
        target,
      );
    }
  }

  const components =
    new Map<
      string,
      GenesisSourceManifestEntry[]
    >();

  for (
    const entry
    of input.admittedEntries
  ) {
    const root =
      find(
        entry.historicalSourceId,
      );

    const entries =
      components.get(
        root,
      ) ??
      [];

    entries.push(
      entry,
    );

    components.set(
      root,
      entries,
    );
  }

  const episodes:
    EvolutionEpisode[] =
    [];

  for (
    const entries
    of components.values()
  ) {
    if (
      entries.length <
      2
    ) {
      continue;
    }

    const sourceReferenceIds =
      [
        ...new Set(
          entries.flatMap(
            entry => {
              const source =
                input.sourceByHistoricalId.get(
                  entry.historicalSourceId,
                );

              return source
                ? [
                    source.sourceReferenceId,
                  ]
                : [];
            },
          ),
        ),
      ].sort();

    const sameLogicalSource =
      sourceReferenceIds.length ===
      1;

    const explicitSemanticLink =
      entries.some(
        entry =>
          entry.supersedes.some(
            id =>
              entries.some(
                candidate =>
                  candidate.historicalSourceId ===
                  id,
              ),
          ) ||
          entry.conflictsWith.some(
            id =>
              entries.some(
                candidate =>
                  candidate.historicalSourceId ===
                  id,
              ),
          ),
      );

    if (
      !sameLogicalSource &&
      !explicitSemanticLink
    ) {
      continue;
    }

    const events =
      entries
        .map(
          entry =>
            input.eventByHistoricalId.get(
              entry.historicalSourceId,
            ),
        )
        .filter(
          (
            event,
          ): event is HistoricalEvent =>
            Boolean(
              event,
            ),
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.occurredAt -
              right.occurredAt ||
            left.eventId.localeCompare(
              right.eventId,
            ),
        );

    if (
      events.length <
      2
    ) {
      continue;
    }

    const eventIds =
      events.map(
        event =>
          event.eventId,
      );

    const eventIdSet =
      new Set<string>(
        eventIds,
      );

    const sourceReferenceIdSet =
      new Set<string>(
        sourceReferenceIds,
      );

    const episodeRelationships =
      input.relationships.filter(
        relationship => {
          const fromInside =
            relationship.from.kind ===
            "event"
              ? eventIdSet.has(
                  relationship.from.id,
                )
              : sourceReferenceIdSet.has(
                  relationship.from.id,
                );

          const toInside =
            relationship.to.kind ===
            "event"
              ? eventIdSet.has(
                  relationship.to.id,
                )
              : sourceReferenceIdSet.has(
                  relationship.to.id,
                );

          return (
            fromInside &&
            toInside
          );
        },
      );

    const semanticRelationships =
      episodeRelationships.filter(
        relationship =>
          relationship.type !==
          "occurred_before",
      );

    const conflicted =
      semanticRelationships.some(
        relationship =>
          relationship.type ===
          "contradicted_by",
      );

    const primaryEntry =
      entries
        .slice()
        .sort(
          (
            left,
            right,
          ) =>
            left.historicalTimestamp -
              right.historicalTimestamp ||
            left.historicalSourceId.localeCompare(
              right.historicalSourceId,
            ),
        )[0];

    const primarySource =
      input.sourceByHistoricalId.get(
        primaryEntry.historicalSourceId,
      );

    if (
      !primarySource
    ) {
      continue;
    }

    const externalSources =
      entries
        .map(
          entry =>
            input.sourceByHistoricalId.get(
              entry.historicalSourceId,
            ),
        )
        .filter(
          (
            source,
          ): source is HistoricalSourceReference =>
            Boolean(
              source,
            ),
        )
        .filter(
          source =>
            source.provenance.externalSource,
        );

    const externalContext =
      externalSources.length ===
      0
        ? "not-required"
        : externalSources.every(
            source =>
              source.integrity.acquisitionState ===
                "available" ||
              source.integrity.acquisitionState ===
                "acquired",
          )
          ? "complete"
          : "pending";

    const episodeKey =
      `source-evolution:${primarySource.sourceReferenceId}`;

    const title =
      sameLogicalSource
        ? `Evolution · ${primarySource.sourceIdentity}`
        : `Historical correlation · ${primarySource.sourceIdentity}`;

    episodes.push(
      createEvolutionEpisode({
        episodeKey,

        title,

        lifecycle:
          conflicted
            ? "conflicted"
            : "correlated",

        eventIds,

        relationshipIds:
          episodeRelationships.map(
            relationship =>
              relationship.relationshipId,
          ),

        sourceReferenceIds,

        externalContext,

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",

            authorityClass:
              "genesis-evolution-episode",
          },

          current: {
            status:
              "unknown",

            authorityClass:
              "genesis-evolution-episode",
          },
        },

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {
          materializationMode:
            sameLogicalSource
              ? "logical-source-revision-lineage"
              : "explicit-semantic-component",

          historicalSourceIds:
            entries
              .map(
                entry =>
                  entry.historicalSourceId,
              )
              .sort(),

          semanticRelationshipCount:
            semanticRelationships.length,

          chronologicalRelationshipCount:
            episodeRelationships.length -
            semanticRelationships.length,
        },
      }),
    );
  }

  return episodes.sort(
    (
      left,
      right,
    ) =>
      left.episodeId.localeCompare(
        right.episodeId,
      ),
  );
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

  const episodes =
    materializeEvolutionEpisodes({
      admittedEntries,

      sourceByHistoricalId,

      eventByHistoricalId,

      relationships,
    });

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

    episodes,
  };
}
