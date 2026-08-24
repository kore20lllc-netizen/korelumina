import {
  mergeGenesisHistoricalCorrelationState,
  reviseEvolutionEpisode,
} from "./GenesisHistoricalCorrelation.js";

import type {
  EvolutionEpisode,
  EvolutionEpisodeId,
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";


function sortedUnique<T extends string>(
  values:
    readonly T[],
): readonly T[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}


function latestEpisodeRevisions(
  episodes:
    readonly EvolutionEpisode[],
): readonly EvolutionEpisode[] {
  const revisionsByEpisode =
    new Map<
      EvolutionEpisodeId,
      EvolutionEpisode[]
    >();

  for (
    const episode
    of episodes
  ) {
    const revisions =
      revisionsByEpisode.get(
        episode.episodeId,
      ) ??
      [];

    revisions.push(
      episode,
    );

    revisionsByEpisode.set(
      episode.episodeId,
      revisions,
    );
  }

  const latest:
    EvolutionEpisode[] =
      [];

  for (
    const revisions
    of revisionsByEpisode.values()
  ) {
    const supersededRevisionIds =
      new Set(
        revisions
          .map(
            revision =>
              revision.lineage
                .previousRevisionId,
          )
          .filter(
            (
              revisionId,
            ): revisionId is
              NonNullable<
                EvolutionEpisode[
                  "lineage"
                ][
                  "previousRevisionId"
                ]
              > =>
              Boolean(
                revisionId,
              ),
          ),
      );

    const candidates =
      revisions.filter(
        revision =>
          !supersededRevisionIds.has(
            revision.revisionId,
          ),
      );

    if (
      candidates.length !==
      1
    ) {
      throw new Error(
        "genesis_correlation_episode_revision_lineage_ambiguous",
      );
    }

    latest.push(
      candidates[0],
    );
  }

  return latest.sort(
    (
      left,
      right,
    ) =>
      left.episodeId.localeCompare(
        right.episodeId,
      ),
  );
}


function sourceOverlapCount(
  left:
    EvolutionEpisode,

  right:
    EvolutionEpisode,
): number {
  const leftSources =
    new Set(
      left.sourceReferenceIds,
    );

  return right.sourceReferenceIds
    .filter(
      sourceReferenceId =>
        leftSources.has(
          sourceReferenceId,
        ),
    )
    .length;
}


function matchingPriorEpisodes(
  incoming:
    EvolutionEpisode,

  existing:
    readonly EvolutionEpisode[],
): readonly EvolutionEpisode[] {
  return existing
    .filter(
      prior =>
        prior.episodeId ===
          incoming.episodeId ||
        sourceOverlapCount(
          prior,
          incoming,
        ) >
          0,
    )
    .sort(
      (
        left,
        right,
      ) => {
        const overlapDifference =
          sourceOverlapCount(
            right,
            incoming,
          ) -
          sourceOverlapCount(
            left,
            incoming,
          );

        if (
          overlapDifference !==
          0
        ) {
          return overlapDifference;
        }

        return left.episodeId.localeCompare(
          right.episodeId,
        );
      },
    );
}


function reviseFromIncoming(
  primary:
    EvolutionEpisode,

  incoming:
    EvolutionEpisode,

  matchedPrior:
    readonly EvolutionEpisode[],
): EvolutionEpisode {
  const secondaryPrior =
    matchedPrior.filter(
      candidate =>
        candidate.episodeId !==
        primary.episodeId,
    );

  return reviseEvolutionEpisode(
    primary,
    {
      title:
        primary.title,

      lifecycle:
        incoming.lifecycle,

      eventIds:
        sortedUnique([
          ...primary.eventIds,
          ...secondaryPrior.flatMap(
            episode =>
              episode.eventIds,
          ),
          ...incoming.eventIds,
        ]),

      relationshipIds:
        sortedUnique([
          ...primary.relationshipIds,
          ...secondaryPrior.flatMap(
            episode =>
              episode.relationshipIds,
          ),
          ...incoming.relationshipIds,
        ]),

      sourceReferenceIds:
        sortedUnique([
          ...primary.sourceReferenceIds,
          ...secondaryPrior.flatMap(
            episode =>
              episode.sourceReferenceIds,
          ),
          ...incoming.sourceReferenceIds,
        ]),

      externalContext:
        incoming.externalContext,

      temporalAuthority:
        incoming.temporalAuthority,

      lineage: {
        mergedFrom:
          sortedUnique([
            ...primary.lineage.mergedFrom,
            ...secondaryPrior
              .map(
                episode =>
                  episode.episodeId,
              ),
            ...secondaryPrior.flatMap(
              episode =>
                episode.lineage
                  .mergedFrom,
            ),
            ...incoming.lineage
              .mergedFrom,
          ]).filter(
            episodeId =>
              episodeId !==
              primary.episodeId,
          ),

        splitFrom:
          primary.lineage.splitFrom,

        supersedes:
          sortedUnique([
            ...primary.lineage
              .supersedes,
            ...secondaryPrior.flatMap(
              episode =>
                episode.lineage
                  .supersedes,
            ),
            ...incoming.lineage
              .supersedes,
          ]),
      },

      metadata: {
        ...primary.metadata,
        ...incoming.metadata,

        revisionIntegrationMode:
          secondaryPrior.length >
          0
            ? "cross-source-episode-merge"
            : "cross-source-episode-enrichment",

        incomingEpisodeId:
          incoming.episodeId,

        matchedPriorEpisodeIds:
          matchedPrior
            .map(
              episode =>
                episode.episodeId,
            )
            .sort(),
      },
    },
  );
}


export function integrateGenesisHistoricalCorrelationRevision(
  existing:
    GenesisHistoricalCorrelationState,

  incoming:
    GenesisHistoricalCorrelationState,
): GenesisHistoricalCorrelationState {
  /*
   * This function cannot manufacture semantic correlation.
   *
   * It only revises prior episodes when the incoming correlation
   * already contains an Evolution Episode produced by the
   * governed materializer. Therefore chronology alone can never
   * trigger cross-replay episode enrichment here.
   */
  const merged =
    mergeGenesisHistoricalCorrelationState(
      existing,
      incoming,
    );

  const priorEpisodes =
    latestEpisodeRevisions(
      existing.episodes,
    );

  const touchedPriorEpisodeIds =
    new Set<
      EvolutionEpisodeId
    >();

  const integratedIncomingEpisodes:
    EvolutionEpisode[] =
      [];

  for (
    const incomingEpisode
    of incoming.episodes
  ) {
    const matches =
      matchingPriorEpisodes(
        incomingEpisode,
        priorEpisodes,
      );

    if (
      matches.length ===
      0
    ) {
      integratedIncomingEpisodes.push(
        incomingEpisode,
      );

      continue;
    }

    const primary =
      matches[0];

    for (
      const match
      of matches
    ) {
      touchedPriorEpisodeIds.add(
        match.episodeId,
      );
    }

    integratedIncomingEpisodes.push(
      reviseFromIncoming(
        primary,
        incomingEpisode,
        matches,
      ),
    );
  }

  const untouchedPriorEpisodes =
    priorEpisodes.filter(
      episode =>
        !touchedPriorEpisodeIds.has(
          episode.episodeId,
        ),
    );

  const episodes =
    [
      ...untouchedPriorEpisodes,
      ...integratedIncomingEpisodes,
    ]
      .sort(
        (
          left,
          right,
        ) =>
          left.episodeId.localeCompare(
            right.episodeId,
          ) ||
          left.revisionId.localeCompare(
            right.revisionId,
          ),
      );

  return {
    ...merged,

    episodes,
  };
}
