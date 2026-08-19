import {
  createHash,
} from "node:crypto";

import type {
  HistoricalSourceClass,
} from "./HistoricalSource.js";

import type {
  GenesisReplayInventory,
} from "./GenesisReplayInventoryService.js";

import type {
  GenesisReplayAdmissionLink,
  GenesisReplayStatusSnapshot,
} from "./GenesisReplayStatusService.js";

import type {
  CorrelationConfidence,
  EvolutionEpisode,
  EvolutionEpisodeId,
  EvolutionEpisodeRevisionId,
  GenesisHistoricalCorrelationState,
  HistoricalEvent,
  HistoricalEventId,
  HistoricalRelationship,
  HistoricalRelationshipId,
  HistoricalSourceReference,
  HistoricalSourceReferenceId,
  HistoricalSourceRevisionId,
} from "./GenesisHistoricalCorrelation.js";

export type GenesisCorpusProjectionId =
  `genesis-corpus-projection:${string}`;

export type GenesisCorpusGovernedCorrelationStatus =
  | "correlated"
  | "not-correlated";

export interface GenesisCorpusSourceRecord {
  sourceReferenceId:
    HistoricalSourceReferenceId;

  sourceRevisionId:
    HistoricalSourceRevisionId;

  sourceIdentity:
    string;

  sourceClass:
    HistoricalSourceClass;

  evidenceType:
    HistoricalSourceReference["evidenceType"];

  externalSource:
    boolean;

  acquisitionState:
    HistoricalSourceReference["integrity"]["acquisitionState"];

  provenance:
    HistoricalSourceReference["provenance"];

  eventIds:
    readonly HistoricalEventId[];

  episodeIds:
    readonly EvolutionEpisodeId[];

  metadata:
    HistoricalSourceReference["metadata"];
}

export interface GenesisCorpusReplayRecord {
  replayId:
    GenesisReplayStatusSnapshot["replayId"];

  found:
    boolean;

  manifestId:
    string | null;

  manifestReadiness:
    GenesisReplayStatusSnapshot["manifestReadiness"];

  executionStatus:
    GenesisReplayStatusSnapshot["executionStatus"];

  replayCorpusStatus:
    GenesisReplayStatusSnapshot["corpusStatus"];

  totalManifestSources:
    number;

  admittedEvidenceIds:
    readonly string[];

  manufacturingRunIds:
    readonly string[];

  packageIds:
    readonly string[];

  canonicalKnowledgeIds:
    readonly string[];

  ambiguousManufacturingLinks:
    number;

  allAdmittedEvidenceLinked:
    boolean;
}

export interface GenesisCorpusKnowledgeLifecycle {
  admittedEvidence:
    number;

  manufacturingLinkedEvidence:
    number;

  ambiguousManufacturingLinks:
    number;

  packages:
    number;

  canonicalKnowledge:
    number;

  organizationalMemory: {
    status:
      GenesisCorpusGovernedCorrelationStatus;

    adaptedRecords:
      number | null;
  };

  educationalEligibility: {
    status:
      GenesisCorpusGovernedCorrelationStatus;

    eligibleRecords:
      number | null;
  };
}

export interface GenesisCorpusExternalContext {
  pendingEpisodes:
    number;

  notYetIngestedConversationSources:
    number;

  externalSourceReferences:
    number;

  complete:
    boolean;
}

export interface GenesisCorpusSourceSummary {
  uniqueSources:
    number;

  sourceRevisions:
    number;

  byClass:
    Readonly<
      Partial<
        Record<
          HistoricalSourceClass,
          number
        >
      >
    >;
}

export interface GenesisCorpusEvolutionSummary {
  historicalEvents:
    number;

  relationships:
    number;

  evolutionEpisodes:
    number;

  conflictedEpisodes:
    number;

  incompleteEpisodes:
    number;

  validatedEpisodes:
    number;

  unresolvedRelationships:
    number;
}

export interface GenesisCorpusReadModel {
  projectionId:
    GenesisCorpusProjectionId;

  sourceSummary:
    GenesisCorpusSourceSummary;

  evolutionSummary:
    GenesisCorpusEvolutionSummary;

  knowledgeLifecycle:
    GenesisCorpusKnowledgeLifecycle;

  externalContext:
    GenesisCorpusExternalContext;

  replays:
    readonly GenesisCorpusReplayRecord[];

  sources:
    readonly GenesisCorpusSourceRecord[];

  events:
    readonly HistoricalEvent[];

  relationships:
    readonly HistoricalRelationship[];

  episodes:
    readonly EvolutionEpisode[];
}

export interface BuildGenesisCorpusReadModelInput {
  replayInventory:
    GenesisReplayInventory;

  correlation:
    GenesisHistoricalCorrelationState;
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

function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}

function replayRecord(
  replay:
    GenesisReplayStatusSnapshot,
): GenesisCorpusReplayRecord {
  const manufacturingRunIds =
    sortedUnique(
      replay.admissionLinks
        .flatMap(
          (
            link,
          ) =>
            link.manufacturingRunId
              ? [
                  link.manufacturingRunId,
                ]
              : [],
        ),
    );

  const packageIds =
    sortedUnique(
      replay.admissionLinks
        .flatMap(
          (
            link,
          ) =>
            link.packageId
              ? [
                  link.packageId,
                ]
              : [],
        ),
    );

  const canonicalKnowledgeIds =
    sortedUnique(
      replay.admissionLinks
        .flatMap(
          (
            link,
          ) =>
            link.canonicalKnowledgeIds,
        ),
    );

  return {
    replayId:
      replay.replayId,

    found:
      replay.found,

    manifestId:
      replay.manifestId,

    manifestReadiness:
      replay.manifestReadiness,

    executionStatus:
      replay.executionStatus,

    replayCorpusStatus:
      replay.corpusStatus,

    totalManifestSources:
      replay.totalManifestSources,

    admittedEvidenceIds:
      sortedUnique(
        replay.admittedEvidenceIds,
      ),

    manufacturingRunIds,

    packageIds,

    canonicalKnowledgeIds,

    ambiguousManufacturingLinks:
      replay.admissionLinks
        .filter(
          (
            link,
          ) =>
            link.ambiguous,
        )
        .length,

    allAdmittedEvidenceLinked:
      replay
        .allAdmittedEvidenceLinked,
  };
}

function sourceRecord(
  source:
    HistoricalSourceReference,

  events:
    readonly HistoricalEvent[],

  episodes:
    readonly EvolutionEpisode[],
): GenesisCorpusSourceRecord {
  const eventIds =
    events
      .filter(
        (
          event,
        ) =>
          event
            .sourceReferenceIds
            .includes(
              source.sourceReferenceId,
            ),
      )
      .map(
        (
          event,
        ) =>
          event.eventId,
      );

  const episodeIds =
    episodes
      .filter(
        (
          episode,
        ) =>
          episode
            .sourceReferenceIds
            .includes(
              source.sourceReferenceId,
            ),
      )
      .map(
        (
          episode,
        ) =>
          episode.episodeId,
      );

  return {
    sourceReferenceId:
      source.sourceReferenceId,

    sourceRevisionId:
      source.sourceRevisionId,

    sourceIdentity:
      source.sourceIdentity,

    sourceClass:
      source.sourceClass,

    evidenceType:
      source.evidenceType,

    externalSource:
      source.provenance
        .externalSource,

    acquisitionState:
      source.integrity
        .acquisitionState,

    provenance:
      {
        ...source.provenance,
      },

    eventIds:
      sortedUnique(
        eventIds,
      ) as readonly HistoricalEventId[],

    episodeIds:
      sortedUnique(
        episodeIds,
      ) as readonly EvolutionEpisodeId[],

    metadata:
      {
        ...source.metadata,
      },
  };
}

function sourceSummary(
  sources:
    readonly HistoricalSourceReference[],
): GenesisCorpusSourceSummary {
  const uniqueSourceIds =
    new Set<
      HistoricalSourceReferenceId
    >();

  const byClass:
    Partial<
      Record<
        HistoricalSourceClass,
        number
      >
    > = {};

  for (
    const source
    of sources
  ) {
    uniqueSourceIds.add(
      source.sourceReferenceId,
    );

    byClass[
      source.sourceClass
    ] =
      (
        byClass[
          source.sourceClass
        ] ??
        0
      ) +
      1;
  }

  return {
    uniqueSources:
      uniqueSourceIds.size,

    sourceRevisions:
      sources.length,

    byClass,
  };
}

function evolutionSummary(
  events:
    readonly HistoricalEvent[],

  relationships:
    readonly HistoricalRelationship[],

  episodes:
    readonly EvolutionEpisode[],
): GenesisCorpusEvolutionSummary {
  return {
    historicalEvents:
      events.length,

    relationships:
      relationships.length,

    evolutionEpisodes:
      episodes.length,

    conflictedEpisodes:
      episodes.filter(
        (
          episode,
        ) =>
          episode.lifecycle ===
          "conflicted",
      ).length,

    incompleteEpisodes:
      episodes.filter(
        (
          episode,
        ) =>
          episode.lifecycle ===
          "incomplete",
      ).length,

    validatedEpisodes:
      episodes.filter(
        (
          episode,
        ) =>
          episode.lifecycle ===
          "validated",
      ).length,

    unresolvedRelationships:
      relationships.filter(
        (
          relationship,
        ) =>
          relationship.confidence ===
          "unresolved",
      ).length,
  };
}

function allAdmissionLinks(
  replays:
    readonly GenesisReplayStatusSnapshot[],
): readonly GenesisReplayAdmissionLink[] {
  return replays.flatMap(
    (
      replay,
    ) =>
      replay.admissionLinks,
  );
}

function knowledgeLifecycle(
  replays:
    readonly GenesisReplayStatusSnapshot[],
): GenesisCorpusKnowledgeLifecycle {
  const admittedEvidence =
    sortedUnique(
      replays.flatMap(
        (
          replay,
        ) =>
          replay
            .admittedEvidenceIds,
      ),
    );

  const links =
    allAdmissionLinks(
      replays,
    );

  const manufacturingLinkedEvidence =
    new Set(
      links
        .filter(
          (
            link,
          ) =>
            link.linked &&
            !link.ambiguous &&
            link.manufacturingRunId !==
              null,
        )
        .map(
          (
            link,
          ) =>
            link.evidenceId,
        ),
    );

  const packageIds =
    sortedUnique(
      links.flatMap(
        (
          link,
        ) =>
          link.packageId
            ? [
                link.packageId,
              ]
            : [],
      ),
    );

  const canonicalKnowledgeIds =
    sortedUnique(
      links.flatMap(
        (
          link,
        ) =>
          link
            .canonicalKnowledgeIds,
      ),
    );

  return {
    admittedEvidence:
      admittedEvidence.length,

    manufacturingLinkedEvidence:
      manufacturingLinkedEvidence
        .size,

    ambiguousManufacturingLinks:
      links.filter(
        (
          link,
        ) =>
          link.ambiguous,
      ).length,

    packages:
      packageIds.length,

    canonicalKnowledge:
      canonicalKnowledgeIds
        .length,

    /*
     * Milestone 32 intentionally refuses to infer these.
     *
     * Canonical promotion does not prove Organizational
     * Memory adaptation, and adaptation does not prove
     * educational eligibility.
     */
    organizationalMemory: {
      status:
        "not-correlated",

      adaptedRecords:
        null,
    },

    educationalEligibility: {
      status:
        "not-correlated",

      eligibleRecords:
        null,
    },
  };
}

function externalContext(
  sources:
    readonly HistoricalSourceReference[],

  episodes:
    readonly EvolutionEpisode[],
): GenesisCorpusExternalContext {
  const externalSourceReferences =
    sources.filter(
      (
        source,
      ) =>
        source.provenance
          .externalSource,
    );

  const conversationSources =
    sources.filter(
      (
        source,
      ) =>
        source.sourceClass ===
          "conversation" &&
        source.integrity
          .acquisitionState ===
          "not-yet-ingested",
    );

  const pendingEpisodes =
    episodes.filter(
      (
        episode,
      ) =>
        episode.externalContext ===
        "pending",
    );

  return {
    pendingEpisodes:
      pendingEpisodes.length,

    notYetIngestedConversationSources:
      conversationSources.length,

    externalSourceReferences:
      externalSourceReferences
        .length,

    complete:
      pendingEpisodes.length ===
        0 &&
      conversationSources.length ===
        0,
  };
}

function compareSource(
  left:
    HistoricalSourceReference,

  right:
    HistoricalSourceReference,
): number {
  const sourceOrder =
    left.sourceReferenceId
      .localeCompare(
        right.sourceReferenceId,
      );

  if (
    sourceOrder !==
      0
  ) {
    return sourceOrder;
  }

  return left.sourceRevisionId
    .localeCompare(
      right.sourceRevisionId,
    );
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
    return left.occurredAt -
      right.occurredAt;
  }

  return left.eventId
    .localeCompare(
      right.eventId,
    );
}

function compareRelationship(
  left:
    HistoricalRelationship,

  right:
    HistoricalRelationship,
): number {
  return left.relationshipId
    .localeCompare(
      right.relationshipId,
    );
}

function compareEpisode(
  left:
    EvolutionEpisode,

  right:
    EvolutionEpisode,
): number {
  const episodeOrder =
    left.episodeId
      .localeCompare(
        right.episodeId,
      );

  if (
    episodeOrder !==
      0
  ) {
    return episodeOrder;
  }

  return left.revisionId
    .localeCompare(
      right.revisionId,
    );
}

export function buildGenesisCorpusReadModel(
  input:
    BuildGenesisCorpusReadModelInput,
): GenesisCorpusReadModel {
  const replayStatuses =
    [
      ...input
        .replayInventory
        .replays,
    ].sort(
      (
        left,
        right,
      ) =>
        left.replayId
          .localeCompare(
            right.replayId,
          ),
    );

  const sources =
    [
      ...input
        .correlation
        .sourceReferences,
    ].sort(
      compareSource,
    );

  const events =
    [
      ...input
        .correlation
        .events,
    ].sort(
      compareEvent,
    );

  const relationships =
    [
      ...input
        .correlation
        .relationships,
    ].sort(
      compareRelationship,
    );

  const episodes =
    [
      ...input
        .correlation
        .episodes,
    ].sort(
      compareEpisode,
    );

  const replayRecords =
    replayStatuses.map(
      replayRecord,
    );

  const sourceRecords =
    sources.map(
      (
        source,
      ) =>
        sourceRecord(
          source,
          events,
          episodes,
        ),
    );

  const projectionId =
    `genesis-corpus-projection:${hashIdentity({
      replayIds:
        replayRecords.map(
          (
            replay,
          ) =>
            replay.replayId,
        ),

      replayState:
        replayRecords.map(
          (
            replay,
          ) => ({
            replayId:
              replay.replayId,

            executionStatus:
              replay.executionStatus,

            replayCorpusStatus:
              replay
                .replayCorpusStatus,

            admittedEvidenceIds:
              replay
                .admittedEvidenceIds,

            packageIds:
              replay.packageIds,

            canonicalKnowledgeIds:
              replay
                .canonicalKnowledgeIds,
          }),
        ),

      sourceRevisionIds:
        sources.map(
          (
            source,
          ) =>
            source.sourceRevisionId,
        ),

      eventIds:
        events.map(
          (
            event,
          ) =>
            event.eventId,
        ),

      relationshipIds:
        relationships.map(
          (
            relationship,
          ) =>
            relationship
              .relationshipId,
        ),

      episodeRevisionIds:
        episodes.map(
          (
            episode,
          ) =>
            episode.revisionId,
        ),
    })}` as GenesisCorpusProjectionId;

  return {
    projectionId,

    sourceSummary:
      sourceSummary(
        sources,
      ),

    evolutionSummary:
      evolutionSummary(
        events,
        relationships,
        episodes,
      ),

    knowledgeLifecycle:
      knowledgeLifecycle(
        replayStatuses,
      ),

    externalContext:
      externalContext(
        sources,
        episodes,
      ),

    replays:
      replayRecords,

    sources:
      sourceRecords,

    events,

    relationships,

    episodes,
  };
}
