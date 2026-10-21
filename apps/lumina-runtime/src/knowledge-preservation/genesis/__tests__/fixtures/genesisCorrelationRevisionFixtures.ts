/*
 * Shared correlation fixtures: a prior correlation with one episode, and
 * an incoming conversation enrichment that revises that episode.
 */
import {
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalRelationship,
  createHistoricalSourceReference,
} from "../../GenesisHistoricalCorrelation.js";

import type {
  GenesisHistoricalCorrelationState,
} from "../../GenesisHistoricalCorrelation.js";


function authority() {
  return {
    historical: {
      status:
        "historically-observed" as const,

      authorityClass:
        "genesis-evolution-episode",
    },

    current: {
      status:
        "unknown" as const,

      authorityClass:
        "genesis-evolution-episode",
    },
  };
}


export function priorCorrelation():
  GenesisHistoricalCorrelationState {
  const sourceA =
    createHistoricalSourceReference({
      sourceIdentity:
        "architecture-source",

      sourceClass:
        "document",

      evidenceType:
        "document",

      sourceRevision:
        "v1",

      provenance: {
        locator:
          "docs://architecture-v1",

        externalSource:
          false,
      },

      integrity: {
        checksum:
          "checksum-a",

        acquisitionState:
          "acquired",
      },

      metadata:
        {},
    });

  const sourceB =
    createHistoricalSourceReference({
      sourceIdentity:
        "architecture-source",

      sourceClass:
        "document",

      evidenceType:
        "document",

      sourceRevision:
        "v2",

      provenance: {
        locator:
          "docs://architecture-v2",

        externalSource:
          false,
      },

      integrity: {
        checksum:
          "checksum-b",

        acquisitionState:
          "acquired",
      },

      metadata:
        {},
    });

  const eventA =
    createHistoricalEvent({
      kind:
        "document-created",

      observationKey:
        "architecture-v1",

      occurredAt:
        100,

      sourceReferenceIds: [
        sourceA.sourceReferenceId,
      ],

      sourceRevisionIds: [
        sourceA.sourceRevisionId,
      ],

      temporalAuthority:
        authority(),

      metadata:
        {},
    });

  const eventB =
    createHistoricalEvent({
      kind:
        "document-amended",

      observationKey:
        "architecture-v2",

      occurredAt:
        200,

      sourceReferenceIds: [
        sourceB.sourceReferenceId,
      ],

      sourceRevisionIds: [
        sourceB.sourceRevisionId,
      ],

      temporalAuthority:
        authority(),

      metadata:
        {},
    });

  const relationship =
    createHistoricalRelationship({
      from: {
        kind:
          "source",

        id:
          sourceB.sourceReferenceId,
      },

      to: {
        kind:
          "source",

        id:
          sourceA.sourceReferenceId,
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
          sourceA.sourceReferenceId,
          sourceB.sourceReferenceId,
        ],

        assertions: [
          "Architecture v2 explicitly supersedes v1.",
        ],
      },
    });

  const episode =
    createEvolutionEpisode({
      episodeKey:
        `source-evolution:${sourceA.sourceReferenceId}`,

      title:
        "Evolution · architecture-source",

      lifecycle:
        "correlated",

      eventIds: [
        eventA.eventId,
        eventB.eventId,
      ],

      relationshipIds: [
        relationship.relationshipId,
      ],

      sourceReferenceIds: [
        sourceA.sourceReferenceId,
        sourceB.sourceReferenceId,
      ],

      externalContext:
        "not-required",

      temporalAuthority:
        authority(),

      lineage: {
        mergedFrom:
          [],

        supersedes:
          [],
      },

      metadata: {
        materializationMode:
          "logical-source-revision-lineage",
      },
    });

  return {
    sourceReferences: [
      sourceA,
      sourceB,
    ],

    events: [
      eventA,
      eventB,
    ],

    relationships: [
      relationship,
    ],

    episodes: [
      episode,
    ],
  };
}


export function enrichedCorrelation(
  prior:
    GenesisHistoricalCorrelationState,
): GenesisHistoricalCorrelationState {
  const conversationSource =
    createHistoricalSourceReference({
      sourceIdentity:
        "conversation-message-001",

      sourceClass:
        "conversation",

      evidenceType:
        "conversation",

      sourceRevision:
        "conversation-checksum",

      provenance: {
        locator:
          "chatgpt://conversation-001/message-001",

        externalSource:
          true,
      },

      integrity: {
        checksum:
          "conversation-checksum",

        acquisitionState:
          "acquired",
      },

      metadata:
        {},
    });

  const conversationEvent =
    createHistoricalEvent({
      kind:
        "requirement-stated",

      observationKey:
        "conversation-message-001",

      occurredAt:
        300,

      sourceReferenceIds: [
        conversationSource
          .sourceReferenceId,
      ],

      sourceRevisionIds: [
        conversationSource
          .sourceRevisionId,
      ],

      temporalAuthority:
        authority(),

      metadata:
        {},
    });

  const priorEpisode =
    prior.episodes[0];

  const targetSourceReferenceId =
    priorEpisode
      .sourceReferenceIds[0];

  const semanticRelationship =
    createHistoricalRelationship({
      from: {
        kind:
          "source",

        id:
          conversationSource
            .sourceReferenceId,
      },

      to: {
        kind:
          "source",

        id:
          targetSourceReferenceId,
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
          conversationSource
            .sourceReferenceId,

          targetSourceReferenceId,
        ],

        assertions: [
          "Conversation explicitly supersedes prior architecture.",
        ],
      },
    });

  const episode =
    createEvolutionEpisode({
      episodeKey:
        `incoming-semantic:${conversationSource.sourceReferenceId}`,

      title:
        "Historical correlation · conversation-message-001",

      lifecycle:
        "correlated",

      eventIds: [
        ...priorEpisode.eventIds,
        conversationEvent.eventId,
      ],

      relationshipIds: [
        ...priorEpisode
          .relationshipIds,
        semanticRelationship
          .relationshipId,
      ],

      sourceReferenceIds: [
        ...priorEpisode
          .sourceReferenceIds,
        conversationSource
          .sourceReferenceId,
      ],

      externalContext:
        "complete",

      temporalAuthority:
        authority(),

      lineage: {
        mergedFrom:
          [],

        supersedes:
          [],
      },

      metadata: {
        materializationMode:
          "explicit-semantic-component",
      },
    });

  return {
    sourceReferences: [
      ...prior.sourceReferences,
      conversationSource,
    ],

    events: [
      ...prior.events,
      conversationEvent,
    ],

    relationships: [
      ...prior.relationships,
      semanticRelationship,
    ],

    episodes: [
      episode,
    ],
  };
}
