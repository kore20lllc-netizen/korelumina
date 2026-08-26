import {
  createHash,
} from "node:crypto";

import type {
  GenesisOperationalProjection,
} from "../knowledge-preservation/genesis/index.js";

import type {
  CurrentAuthorityStatus,
  EvolutionEpisodeLifecycle,
  HistoricalAuthorityStatus,
  HistoricalEventKind,
} from "../knowledge-preservation/genesis/GenesisHistoricalCorrelation.js";


export const GENESIS_HISTORICAL_EDUCATION_PROJECTION_VERSION =
  "genesis-historical-education:v1" as const;


export type GenesisHistoricalEducationRecordId =
  `genesis-historical-education:${string}`;


export interface GenesisHistoricalEducationSourceReference {
  sourceReferenceId:
    string;

  sourceRevisionId:
    string;

  sourceIdentity:
    string;

  sourceClass:
    string;

  evidenceType:
    string;

  acquisitionState:
    string;

  provenance: {
    locator?:
      string;

    nativeId?:
      string;

    repository?:
      string;

    ref?:
      string;

    sourceReference?:
      string;

    externalSource:
      boolean;
  };
}


export interface GenesisHistoricalEducationEventReference {
  eventId:
    string;

  kind:
    HistoricalEventKind;

  occurredAt:
    number;

  summary:
    string | null;
}


export interface GenesisHistoricalEducationRecord {
  recordId:
    GenesisHistoricalEducationRecordId;

  projectionVersion:
    typeof GENESIS_HISTORICAL_EDUCATION_PROJECTION_VERSION;

  replayId:
    string;

  episodeId:
    string;

  episodeRevisionId:
    string;

  episodeKey:
    string;

  title:
    string;

  lifecycle:
    EvolutionEpisodeLifecycle;

  externalContext:
    "complete" |
    "pending" |
    "not-required";

  temporalAuthority: {
    historicalStatus:
      HistoricalAuthorityStatus;

    currentStatus:
      CurrentAuthorityStatus;

    historicalAuthorityClass:
      string | null;

    historicalApprovalState:
      string | null;

    currentAuthorityClass:
      string | null;

    currentApprovalState:
      string | null;

    replacedBy:
      string | null;
  };

  eventReferences:
    readonly GenesisHistoricalEducationEventReference[];

  sourceReferences:
    readonly GenesisHistoricalEducationSourceReference[];

  relationshipIds:
    readonly string[];

  lineage: {
    previousRevisionId:
      string | null;

    mergedFrom:
      readonly string[];

    splitFrom:
      string | null;

    supersedes:
      readonly string[];
  };

  /*
   * This projection is historical educational evidence only.
   *
   * It does not establish:
   * - current governing authority
   * - Educational Corpus admission
   * - curriculum coverage
   * - Initial Competency
   * - Chief Agent activation
   */
  governingAuthorityCreated:
    false;

  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
}


export interface GenesisHistoricalEducationProjection {
  projectionVersion:
    typeof GENESIS_HISTORICAL_EDUCATION_PROJECTION_VERSION;

  replayId:
    string;

  dayZeroCandidateId:
    string;

  records:
    readonly GenesisHistoricalEducationRecord[];

  summary: {
    records:
      number;

    sourceReferences:
      number;

    eventReferences:
      number;

    byLifecycle:
      Readonly<
        Partial<
          Record<
            EvolutionEpisodeLifecycle,
            number
          >
        >
      >;
  };

  governingAuthorityCreated:
    false;

  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
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
          key => [
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


function hash(
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


export function projectGenesisHistoricalEducation(
  operational:
    GenesisOperationalProjection,
): GenesisHistoricalEducationProjection {
  const sourceById =
    new Map(
      operational.corpus.sources.map(
        source => [
          source.sourceReferenceId,
          source,
        ],
      ),
    );

  const eventById =
    new Map(
      operational.corpus.events.map(
        event => [
          event.eventId,
          event,
        ],
      ),
    );

  const records =
    operational.corpus.episodes
      .map(
        episode => {
          const sourceReferences =
            episode.sourceReferenceIds
              .map(
                sourceReferenceId =>
                  sourceById.get(
                    sourceReferenceId,
                  ),
              )
              .filter(
                (
                  source,
                ): source is NonNullable<
                  typeof source
                > =>
                  Boolean(
                    source,
                  ),
              )
              .map(
                source => ({
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

                  acquisitionState:
                    source.acquisitionState,

                  provenance: {
                    ...source.provenance,
                  },
                }),
              )
              .sort(
                (
                  left,
                  right,
                ) =>
                  left.sourceReferenceId
                    .localeCompare(
                      right.sourceReferenceId,
                    ),
              );

          const eventReferences =
            episode.eventIds
              .map(
                eventId =>
                  eventById.get(
                    eventId,
                  ),
              )
              .filter(
                (
                  event,
                ): event is NonNullable<
                  typeof event
                > =>
                  Boolean(
                    event,
                  ),
              )
              .map(
                event => ({
                  eventId:
                    event.eventId,

                  kind:
                    event.kind,

                  occurredAt:
                    event.occurredAt,

                  summary:
                    event.summary ??
                    null,
                }),
              )
              .sort(
                (
                  left,
                  right,
                ) =>
                  left.occurredAt -
                    right.occurredAt ||
                  left.eventId
                    .localeCompare(
                      right.eventId,
                    ),
              );

          const recordIdentity = {
            replayId:
              operational.replayId,

            episodeId:
              episode.episodeId,

            revisionId:
              episode.revisionId,
          };

          return {
            recordId:
              `genesis-historical-education:${hash(
                recordIdentity,
              )}` as GenesisHistoricalEducationRecordId,

            projectionVersion:
              GENESIS_HISTORICAL_EDUCATION_PROJECTION_VERSION,

            replayId:
              operational.replayId,

            episodeId:
              episode.episodeId,

            episodeRevisionId:
              episode.revisionId,

            episodeKey:
              episode.episodeKey,

            title:
              episode.title,

            lifecycle:
              episode.lifecycle,

            externalContext:
              episode.externalContext,

            temporalAuthority: {
              historicalStatus:
                episode.temporalAuthority
                  .historical
                  .status,

              currentStatus:
                episode.temporalAuthority
                  .current
                  .status,

              historicalAuthorityClass:
                episode.temporalAuthority
                  .historical
                  .authorityClass ??
                null,

              historicalApprovalState:
                episode.temporalAuthority
                  .historical
                  .approvalState ??
                null,

              currentAuthorityClass:
                episode.temporalAuthority
                  .current
                  .authorityClass ??
                null,

              currentApprovalState:
                episode.temporalAuthority
                  .current
                  .approvalState ??
                null,

              replacedBy:
                episode.temporalAuthority
                  .current
                  .replacedBy ??
                null,
            },

            eventReferences,

            sourceReferences,

            relationshipIds:
              sortedUnique(
                episode.relationshipIds,
              ),

            lineage: {
              previousRevisionId:
                episode.lineage
                  .previousRevisionId ??
                null,

              mergedFrom:
                sortedUnique(
                  episode.lineage
                    .mergedFrom,
                ),

              splitFrom:
                episode.lineage
                  .splitFrom ??
                null,

              supersedes:
                sortedUnique(
                  episode.lineage
                    .supersedes,
                ),
            },

            governingAuthorityCreated:
              false as const,

            educationalCorpusCertified:
              false as const,

            initialCompetencyCertified:
              false as const,

            chiefAgentActivationAuthorized:
              false as const,
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.episodeId
            .localeCompare(
              right.episodeId,
            ),
      );

  const byLifecycle:
    Partial<
      Record<
        EvolutionEpisodeLifecycle,
        number
      >
    > = {};

  for (
    const record
    of records
  ) {
    byLifecycle[
      record.lifecycle
    ] =
      (
        byLifecycle[
          record.lifecycle
        ] ??
        0
      ) +
      1;
  }

  return {
    projectionVersion:
      GENESIS_HISTORICAL_EDUCATION_PROJECTION_VERSION,

    replayId:
      operational.replayId,

    dayZeroCandidateId:
      operational
        .dayZeroCertificationCandidate
        .candidateId,

    records,

    summary: {
      records:
        records.length,

      sourceReferences:
        records.reduce(
          (
            total,
            record,
          ) =>
            total +
            record
              .sourceReferences
              .length,
          0,
        ),

      eventReferences:
        records.reduce(
          (
            total,
            record,
          ) =>
            total +
            record
              .eventReferences
              .length,
          0,
        ),

      byLifecycle,
    },

    governingAuthorityCreated:
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}
