import {
  createHash,
} from "node:crypto";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  HistoricalEventId,
  HistoricalSourceReferenceId,
  EvolutionEpisodeId,
} from "./GenesisHistoricalCorrelation.js";

import type {
  GenesisReplayCheckpointDisposition,
} from "./GenesisReplayCheckpoint.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

export type GenesisHistoricalKnowledgeLineageProjectionId =
  `genesis-historical-knowledge-lineage:${string}`;

export type GenesisHistoricalKnowledgeLineageStatus =
  | "correlated"
  | "source-reference-missing"
  | "ambiguous-source-reference";

export interface GenesisHistoricalKnowledgeLineageRecord {
  historicalSourceId:
    HistoricalSourceId;

  evidenceId:
    string;

  status:
    GenesisHistoricalKnowledgeLineageStatus;

  sourceReferenceIds:
    readonly HistoricalSourceReferenceId[];

  eventIds:
    readonly HistoricalEventId[];

  episodeIds:
    readonly EvolutionEpisodeId[];
}

export interface GenesisHistoricalKnowledgeLineageProjection {
  projectionId:
    GenesisHistoricalKnowledgeLineageProjectionId;

  corpusProjectionId:
    GenesisCorpusReadModel["projectionId"];

  records:
    readonly GenesisHistoricalKnowledgeLineageRecord[];

  summary: {
    admittedEvidence:
      number;

    correlated:
      number;

    sourceReferenceMissing:
      number;

    ambiguousSourceReference:
      number;
  };
}

export interface BuildGenesisHistoricalKnowledgeLineageInput {
  corpus:
    GenesisCorpusReadModel;

  dispositions:
    readonly GenesisReplayCheckpointDisposition[];
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

function historicalSourceIdFromMetadata(
  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >,
): HistoricalSourceId | null {
  const value =
    metadata[
      "historicalSourceId"
    ];

  if (
    typeof value !==
      "string" ||
    !value.startsWith(
      "genesis-source:",
    )
  ) {
    return null;
  }

  return value as
    HistoricalSourceId;
}

function recordFor(
  input: {
    corpus:
      GenesisCorpusReadModel;

    historicalSourceId:
      HistoricalSourceId;

    evidenceId:
      string;
  },
): GenesisHistoricalKnowledgeLineageRecord {
  const sources =
    input.corpus.sources
      .filter(
        source =>
          historicalSourceIdFromMetadata(
            source.metadata,
          ) ===
          input.historicalSourceId,
      )
      .slice()
      .sort(
        (
          left,
          right,
        ) =>
          left.sourceReferenceId
            .localeCompare(
              right.sourceReferenceId,
            ) ||
          left.sourceRevisionId
            .localeCompare(
              right.sourceRevisionId,
            ),
      );

  const sourceReferenceIds =
    sortedUnique(
      sources.map(
        source =>
          source.sourceReferenceId,
      ),
    );

  const eventIds =
    sortedUnique(
      sources.flatMap(
        source =>
          source.eventIds,
      ),
    );

  const episodeIds =
    sortedUnique(
      sources.flatMap(
        source =>
          source.episodeIds,
      ),
    );

  return {
    historicalSourceId:
      input.historicalSourceId,

    evidenceId:
      input.evidenceId,

    status:
      sourceReferenceIds.length ===
        0
        ? "source-reference-missing"
        : sourceReferenceIds.length ===
            1
          ? "correlated"
          : "ambiguous-source-reference",

    sourceReferenceIds:
      sourceReferenceIds as readonly HistoricalSourceReferenceId[],

    eventIds:
      eventIds as readonly HistoricalEventId[],

    episodeIds:
      episodeIds as readonly EvolutionEpisodeId[],
  };
}

export function buildGenesisHistoricalKnowledgeLineage(
  input:
    BuildGenesisHistoricalKnowledgeLineageInput,
): GenesisHistoricalKnowledgeLineageProjection {
  const admitted =
    input.dispositions
      .filter(
        disposition =>
          disposition.disposition ===
            "ADMITTED" &&
          Boolean(
            disposition.evidenceId
              ?.trim(),
          ),
      )
      .map(
        disposition => ({
          historicalSourceId:
            disposition.historicalSourceId,

          evidenceId:
            disposition.evidenceId!
              .trim(),
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.historicalSourceId
            .localeCompare(
              right.historicalSourceId,
            ) ||
          left.evidenceId
            .localeCompare(
              right.evidenceId,
            ),
      );

  const records =
    admitted.map(
      item =>
        recordFor({
          corpus:
            input.corpus,

          historicalSourceId:
            item.historicalSourceId,

          evidenceId:
            item.evidenceId,
        }),
    );

  const summary = {
    admittedEvidence:
      records.length,

    correlated:
      records.filter(
        record =>
          record.status ===
          "correlated",
      ).length,

    sourceReferenceMissing:
      records.filter(
        record =>
          record.status ===
          "source-reference-missing",
      ).length,

    ambiguousSourceReference:
      records.filter(
        record =>
          record.status ===
          "ambiguous-source-reference",
      ).length,
  };

  const projectionId =
    `genesis-historical-knowledge-lineage:${hash({
      corpusProjectionId:
        input.corpus
          .projectionId,

      records,

      summary,
    })}` as
      GenesisHistoricalKnowledgeLineageProjectionId;

  return {
    projectionId,

    corpusProjectionId:
      input.corpus
        .projectionId,

    records,

    summary,
  };
}
