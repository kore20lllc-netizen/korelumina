import {
  createHash,
} from "node:crypto";

import type {
  GenesisReplayCheckpointDisposition,
} from "./GenesisReplayCheckpoint.js";

import type {
  EvolutionEpisode,
  GenesisHistoricalCorrelationState,
  HistoricalSourceReference,
} from "./GenesisHistoricalCorrelation.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";


export type GenesisConversationCorrelationCompletenessProjectionId =
  `genesis-conversation-correlation-completeness:${string}`;


export type GenesisConversationCorrelationCompletenessState =
  | "COMPLETE"
  | "INCOMPLETE";


export interface GenesisConversationUnresolvedHistoricalLink {
  sourceHistoricalSourceId:
    string;

  targetHistoricalSourceId:
    string;

  relationship:
    "supersedes" |
    "conflicts-with";
}


export interface GenesisConversationEpisodeLineageGap {
  episodeId:
    string;

  revisionId:
    string;

  reason:
    "cross-replay-revision-missing-previous-revision";
}


export interface GenesisConversationCorrelationCompletenessProjection {
  projectionId:
    GenesisConversationCorrelationCompletenessProjectionId;

  state:
    GenesisConversationCorrelationCompletenessState;

  conversationManifestSources:
    number;

  eligibleConversationSources:
    number;

  admittedConversationSources:
    number;

  correlatedConversationSources:
    number;

  correlatedConversationEvents:
    number;

  missingAdmissionHistoricalSourceIds:
    readonly string[];

  missingCorrelationHistoricalSourceIds:
    readonly string[];

  missingEventHistoricalSourceIds:
    readonly string[];

  unresolvedExplicitLinks:
    readonly GenesisConversationUnresolvedHistoricalLink[];

  crossReplayEnrichedEpisodes:
    number;

  episodeLineageGaps:
    readonly GenesisConversationEpisodeLineageGap[];

  blockers:
    readonly string[];

  /*
   * Deliberately not a Genesis certification.
   * This projection establishes only conversation/correlation
   * integration completeness for the replay being inspected.
   */
  dayZeroGenesisCertified:
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


function historicalSourceIdForReference(
  source:
    HistoricalSourceReference,
): string | null {
  const value =
    source.metadata[
      "historicalSourceId"
    ];

  return typeof value ===
    "string" &&
    value.trim()
      ? value.trim()
      : null;
}


function isCrossReplayEpisode(
  episode:
    EvolutionEpisode,
): boolean {
  const mode =
    episode.metadata[
      "revisionIntegrationMode"
    ];

  return (
    mode ===
      "cross-source-episode-enrichment" ||
    mode ===
      "cross-source-episode-merge"
  );
}


export function buildGenesisConversationCorrelationCompleteness(
  input: {
    manifestEntries:
      readonly GenesisSourceManifestEntry[];

    dispositions:
      readonly GenesisReplayCheckpointDisposition[];

    correlation:
      GenesisHistoricalCorrelationState;
  },
): GenesisConversationCorrelationCompletenessProjection {
  const conversationEntries =
    input.manifestEntries
      .filter(
        entry =>
          entry.evidenceType ===
            "conversation",
      )
      .slice()
      .sort(
        (
          left,
          right,
        ) =>
          left.historicalSourceId
            .localeCompare(
              right.historicalSourceId,
            ),
      );

  const eligibleConversationEntries =
    conversationEntries.filter(
      entry =>
        entry.replayEligibility ===
        "eligible",
    );

  const dispositionByHistoricalSourceId =
    new Map(
      input.dispositions.map(
        disposition => [
          disposition.historicalSourceId,
          disposition,
        ],
      ),
    );

  const admittedConversationEntries =
    eligibleConversationEntries
      .filter(
        entry =>
          dispositionByHistoricalSourceId
            .get(
              entry.historicalSourceId,
            )
            ?.disposition ===
          "ADMITTED",
      );

  const correlatedHistoricalSourceIds =
    new Set(
      input.correlation
        .sourceReferences
        .map(
          historicalSourceIdForReference,
        )
        .filter(
          (
            value,
          ): value is string =>
            value !==
            null,
        ),
    );

  const eventHistoricalSourceIds =
    new Set(
      input.correlation
        .events
        .map(
          event => {
            const value =
              event.metadata[
                "historicalSourceId"
              ];

            return typeof value ===
              "string" &&
              value.trim()
              ? value.trim()
              : null;
          },
        )
        .filter(
          (
            value,
          ): value is string =>
            value !==
            null,
        ),
    );

  const missingAdmissionHistoricalSourceIds =
    eligibleConversationEntries
      .filter(
        entry =>
          dispositionByHistoricalSourceId
            .get(
              entry.historicalSourceId,
            )
            ?.disposition !==
          "ADMITTED",
      )
      .map(
        entry =>
          entry.historicalSourceId,
      )
      .sort();

  const missingCorrelationHistoricalSourceIds =
    admittedConversationEntries
      .filter(
        entry =>
          !correlatedHistoricalSourceIds.has(
            entry.historicalSourceId,
          ),
      )
      .map(
        entry =>
          entry.historicalSourceId,
      )
      .sort();

  const missingEventHistoricalSourceIds =
    admittedConversationEntries
      .filter(
        entry =>
          !eventHistoricalSourceIds.has(
            entry.historicalSourceId,
          ),
      )
      .map(
        entry =>
          entry.historicalSourceId,
      )
      .sort();

  const manifestHistoricalSourceIds =
    new Set(
      input.manifestEntries.map(
        entry =>
          entry.historicalSourceId,
      ),
    );

  const correlatedManifestHistoricalSourceIds =
    new Set([
      ...manifestHistoricalSourceIds,
      ...correlatedHistoricalSourceIds,
    ]);

  const unresolvedExplicitLinks:
    GenesisConversationUnresolvedHistoricalLink[] =
      [];

  for (
    const entry
    of admittedConversationEntries
  ) {
    for (
      const target
      of entry.supersedes
    ) {
      if (
        !correlatedManifestHistoricalSourceIds.has(
          target,
        )
      ) {
        unresolvedExplicitLinks.push({
          sourceHistoricalSourceId:
            entry.historicalSourceId,

          targetHistoricalSourceId:
            target,

          relationship:
            "supersedes",
        });
      }
    }

    for (
      const target
      of entry.conflictsWith
    ) {
      if (
        !correlatedManifestHistoricalSourceIds.has(
          target,
        )
      ) {
        unresolvedExplicitLinks.push({
          sourceHistoricalSourceId:
            entry.historicalSourceId,

          targetHistoricalSourceId:
            target,

          relationship:
            "conflicts-with",
        });
      }
    }
  }

  unresolvedExplicitLinks.sort(
    (
      left,
      right,
    ) =>
      left.sourceHistoricalSourceId
        .localeCompare(
          right.sourceHistoricalSourceId,
        ) ||
      left.relationship
        .localeCompare(
          right.relationship,
        ) ||
      left.targetHistoricalSourceId
        .localeCompare(
          right.targetHistoricalSourceId,
        ),
  );

  const crossReplayEpisodes =
    input.correlation
      .episodes
      .filter(
        isCrossReplayEpisode,
      );

  const episodeLineageGaps:
    GenesisConversationEpisodeLineageGap[] =
      crossReplayEpisodes
        .filter(
          episode =>
            !episode.lineage
              .previousRevisionId,
        )
        .map(
          episode => ({
            episodeId:
              episode.episodeId,

            revisionId:
              episode.revisionId,

            reason:
              "cross-replay-revision-missing-previous-revision" as const,
          }),
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.episodeId
              .localeCompare(
                right.episodeId,
              ) ||
            left.revisionId
              .localeCompare(
                right.revisionId,
              ),
        );

  const blockers:
    string[] =
      [];

  if (
    conversationEntries.length ===
    0
  ) {
    blockers.push(
      "conversation-sources-absent-from-replay",
    );
  }

  if (
    missingAdmissionHistoricalSourceIds.length >
    0
  ) {
    blockers.push(
      "eligible-conversation-sources-not-admitted",
    );
  }

  if (
    missingCorrelationHistoricalSourceIds.length >
    0
  ) {
    blockers.push(
      "admitted-conversation-sources-missing-from-correlation",
    );
  }

  if (
    missingEventHistoricalSourceIds.length >
    0
  ) {
    blockers.push(
      "admitted-conversation-events-missing-from-correlation",
    );
  }

  if (
    unresolvedExplicitLinks.length >
    0
  ) {
    blockers.push(
      "conversation-explicit-historical-links-unresolved",
    );
  }

  if (
    episodeLineageGaps.length >
    0
  ) {
    blockers.push(
      "cross-replay-episode-lineage-incomplete",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    GenesisConversationCorrelationCompletenessState =
      normalizedBlockers.length ===
      0
        ? "COMPLETE"
        : "INCOMPLETE";

  const correlatedConversationSources =
    admittedConversationEntries.filter(
      entry =>
        correlatedHistoricalSourceIds.has(
          entry.historicalSourceId,
        ),
    ).length;

  const correlatedConversationEvents =
    admittedConversationEntries.filter(
      entry =>
        eventHistoricalSourceIds.has(
          entry.historicalSourceId,
        ),
    ).length;

  const projectionId =
    `genesis-conversation-correlation-completeness:${hash({
      conversationHistoricalSourceIds:
        conversationEntries.map(
          entry =>
            entry.historicalSourceId,
        ),

      eligibleConversationHistoricalSourceIds:
        eligibleConversationEntries.map(
          entry =>
            entry.historicalSourceId,
        ),

      admittedConversationHistoricalSourceIds:
        admittedConversationEntries.map(
          entry =>
            entry.historicalSourceId,
        ),

      correlatedConversationSources,

      correlatedConversationEvents,

      missingAdmissionHistoricalSourceIds,

      missingCorrelationHistoricalSourceIds,

      missingEventHistoricalSourceIds,

      unresolvedExplicitLinks,

      crossReplayEpisodeRevisionIds:
        crossReplayEpisodes
          .map(
            episode =>
              episode.revisionId,
          )
          .sort(),

      episodeLineageGaps,

      blockers:
        normalizedBlockers,
    })}` as GenesisConversationCorrelationCompletenessProjectionId;

  return {
    projectionId,

    state,

    conversationManifestSources:
      conversationEntries.length,

    eligibleConversationSources:
      eligibleConversationEntries.length,

    admittedConversationSources:
      admittedConversationEntries.length,

    correlatedConversationSources,

    correlatedConversationEvents,

    missingAdmissionHistoricalSourceIds,

    missingCorrelationHistoricalSourceIds,

    missingEventHistoricalSourceIds,

    unresolvedExplicitLinks,

    crossReplayEnrichedEpisodes:
      crossReplayEpisodes.length,

    episodeLineageGaps,

    blockers:
      normalizedBlockers,

    dayZeroGenesisCertified:
      false,
  };
}
