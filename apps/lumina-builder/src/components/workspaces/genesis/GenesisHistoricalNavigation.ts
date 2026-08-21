import {
  useCallback,
  useRef,
  useState,
} from "react";

import type {
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

export type GenesisHistoricalArtifactKind =
  | "source"
  | "event"
  | "episode";

export interface GenesisHistoricalArtifactNavigationTarget {
  kind:
    GenesisHistoricalArtifactKind;

  id:
    string;

  requestId:
    number;
}

export interface GenesisTemporalChronologyNavigationTarget {
  eventId:
    string;

  requestId:
    number;
}

export interface GenesisHistoricalRelationshipNavigationTarget {
  relationshipId:
    string;

  requestId:
    number;
}

export interface GenesisEvolutionEpisodeNavigationTarget {
  episodeId:
    string;

  requestId:
    number;
}

export interface GenesisHistoricalNavigationState {
  artifact:
    GenesisHistoricalArtifactNavigationTarget | null;

  chronology:
    GenesisTemporalChronologyNavigationTarget | null;

  relationship:
    GenesisHistoricalRelationshipNavigationTarget | null;

  episode:
    GenesisEvolutionEpisodeNavigationTarget | null;
}

export interface GenesisHistoricalArtifactLinks {
  eventIds:
    readonly string[];

  relationshipIds:
    readonly string[];

  episodeIds:
    readonly string[];
}

function unique(
  values:
    readonly string[],
): readonly string[] {
  return Array.from(
    new Set(
      values,
    ),
  );
}

export function resolveGenesisHistoricalArtifactLinks(
  projection:
    GenesisOperationalProjection,

  target:
    Pick<
      GenesisHistoricalArtifactNavigationTarget,
      "kind" | "id"
    >,
): GenesisHistoricalArtifactLinks {
  const {
    sources,
    events,
    relationships,
    episodes,
  } =
    projection.corpus;

  const eventIds =
    new Set(
      events.map(
        event =>
          event.eventId,
      ),
    );

  const relationshipIds =
    new Set(
      relationships.map(
        relationship =>
          relationship.relationshipId,
      ),
    );

  const episodeIds =
    new Set(
      episodes.map(
        episode =>
          episode.episodeId,
      ),
    );

  if (
    target.kind ===
    "source"
  ) {
    const source =
      sources.find(
        candidate =>
          candidate.sourceReferenceId ===
          target.id,
      );

    if (
      !source
    ) {
      return {
        eventIds:
          [],
        relationshipIds:
          [],
        episodeIds:
          [],
      };
    }

    const sourceEventIds =
      source.eventIds.filter(
        id =>
          eventIds.has(
            id,
          ),
      );

    const sourceEventIdSet =
      new Set(
        sourceEventIds,
      );

    return {
      eventIds:
        sourceEventIds,

      relationshipIds:
        unique(
          relationships
            .filter(
              relationship =>
                relationship.from.id ===
                  source.sourceReferenceId ||
                relationship.to.id ===
                  source.sourceReferenceId ||
                (
                  relationship.from.kind ===
                    "event" &&
                  sourceEventIdSet.has(
                    relationship.from.id,
                  )
                ) ||
                (
                  relationship.to.kind ===
                    "event" &&
                  sourceEventIdSet.has(
                    relationship.to.id,
                  )
                ),
            )
            .map(
              relationship =>
                relationship.relationshipId,
            ),
        ),

      episodeIds:
        source.episodeIds.filter(
          id =>
            episodeIds.has(
              id,
            ),
        ),
    };
  }

  if (
    target.kind ===
    "event"
  ) {
    const event =
      events.find(
        candidate =>
          candidate.eventId ===
          target.id,
      );

    if (
      !event
    ) {
      return {
        eventIds:
          [],
        relationshipIds:
          [],
        episodeIds:
          [],
      };
    }

    return {
      eventIds: [
        event.eventId,
      ],

      relationshipIds:
        relationships
          .filter(
            relationship =>
              (
                relationship.from.kind ===
                  "event" &&
                relationship.from.id ===
                  event.eventId
              ) ||
              (
                relationship.to.kind ===
                  "event" &&
                relationship.to.id ===
                  event.eventId
              ),
          )
          .map(
            relationship =>
              relationship.relationshipId,
          ),

      episodeIds:
        episodes
          .filter(
            episode =>
              episode.eventIds.includes(
                event.eventId,
              ),
          )
          .map(
            episode =>
              episode.episodeId,
          ),
    };
  }

  const episode =
    episodes.find(
      candidate =>
        candidate.episodeId ===
        target.id,
    );

  if (
    !episode
  ) {
    return {
      eventIds:
        [],
      relationshipIds:
        [],
      episodeIds:
        [],
    };
  }

  return {
    eventIds:
      episode.eventIds.filter(
        id =>
          eventIds.has(
            id,
          ),
      ),

    relationshipIds:
      episode.relationshipIds.filter(
        id =>
          relationshipIds.has(
            id,
          ),
      ),

    episodeIds:
      episodeIds.has(
        episode.episodeId,
      )
        ? [
            episode.episodeId,
          ]
        : [],
  };
}

function findVerticalScrollContainer(
  element:
    HTMLElement,
): HTMLElement | null {
  let parent =
    element.parentElement;

  while (
    parent
  ) {
    const style =
      window.getComputedStyle(
        parent,
      );

    const overflowY =
      style.overflowY;

    const canScroll =
      (
        overflowY ===
          "auto" ||
        overflowY ===
          "scroll"
      ) &&
      parent.scrollHeight >
        parent.clientHeight;

    if (
      canScroll
    ) {
      return parent;
    }

    parent =
      parent.parentElement;
  }

  return null;
}

function scrollToGenesisSection(
  sectionId:
    string,
) {
  if (
    typeof document ===
      "undefined" ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  /*
   * Navigation state is committed first. The scroll happens on the
   * following animation frame so the destination inspector has already
   * processed its exact Runtime identity.
   */
  window.requestAnimationFrame(
    () => {
      const section =
        document.getElementById(
          sectionId,
        );

      if (
        !section
      ) {
        return;
      }

      const reduceMotion =
        typeof window.matchMedia ===
          "function" &&
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

      const behavior:
        ScrollBehavior =
        reduceMotion
          ? "auto"
          : "smooth";

      const scrollContainer =
        findVerticalScrollContainer(
          section,
        );

      if (
        !scrollContainer
      ) {
        section.scrollIntoView({
          behavior,
          block:
            "start",
        });

        return;
      }

      const sectionRect =
        section.getBoundingClientRect();

      const containerRect =
        scrollContainer
          .getBoundingClientRect();

      /*
       * Leave room for the sticky Genesis section navigator rather than
       * placing the destination directly underneath it.
       */
      const stickyOffset =
        112;

      const top =
        scrollContainer.scrollTop +
        sectionRect.top -
        containerRect.top -
        stickyOffset;

      scrollContainer.scrollTo({
        top:
          Math.max(
            0,
            top,
          ),
        behavior,
      });
    },
  );
}

export function useGenesisHistoricalNavigation() {
  const requestId =
    useRef(
      0,
    );

  const [
    state,
    setState,
  ] =
    useState<GenesisHistoricalNavigationState>({
      artifact:
        null,
      chronology:
        null,
      relationship:
        null,
      episode:
        null,
    });

  const nextRequestId =
    useCallback(
      () => {
        requestId.current +=
          1;

        return requestId.current;
      },
      [],
    );

  const navigateToArtifact =
    useCallback(
      (
        target:
          Omit<
            GenesisHistoricalArtifactNavigationTarget,
            "requestId"
          >,
      ) => {
        setState(
          previous => ({
            ...previous,
            artifact: {
              ...target,
              requestId:
                nextRequestId(),
            },
          }),
        );

        scrollToGenesisSection(
          "genesis-historical-artifacts",
        );
      },
      [
        nextRequestId,
      ],
    );

  const navigateToChronology =
    useCallback(
      (
        eventId:
          string,
      ) => {
        setState(
          previous => ({
            ...previous,
            chronology: {
              eventId,
              requestId:
                nextRequestId(),
            },
          }),
        );

        scrollToGenesisSection(
          "genesis-temporal-chronology",
        );
      },
      [
        nextRequestId,
      ],
    );

  const navigateToRelationship =
    useCallback(
      (
        relationshipId:
          string,
      ) => {
        setState(
          previous => ({
            ...previous,
            relationship: {
              relationshipId,
              requestId:
                nextRequestId(),
            },
          }),
        );

        scrollToGenesisSection(
          "genesis-historical-relationships",
        );
      },
      [
        nextRequestId,
      ],
    );

  const navigateToEpisode =
    useCallback(
      (
        episodeId:
          string,
      ) => {
        setState(
          previous => ({
            ...previous,
            episode: {
              episodeId,
              requestId:
                nextRequestId(),
            },
          }),
        );

        scrollToGenesisSection(
          "genesis-evolution-episodes",
        );
      },
      [
        nextRequestId,
      ],
    );

  return {
    state,
    navigateToArtifact,
    navigateToChronology,
    navigateToRelationship,
    navigateToEpisode,
  };
}
