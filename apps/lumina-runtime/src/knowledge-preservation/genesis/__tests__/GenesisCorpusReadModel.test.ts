import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import type {
  GenesisReplayStatusSnapshot,
} from "../GenesisReplayStatusService.js";

import {
  createChronologicalRelationship,
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalSourceReference,
  reviseEvolutionEpisode,
} from "../GenesisHistoricalCorrelation.js";

import {
  buildGenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

const REPLAY_ID =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const authority = {
  historical: {
    status:
      "historically-implemented" as const,

    authorityClass:
      "implementation",

    approvalState:
      "observed",
  },

  current: {
    status:
      "currently-implemented" as const,
  },
};

function commitSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "git-commit:abc123",

    sourceClass:
      "commit",

    evidenceType:
      "commit",

    sourceRevision:
      "abc123",

    provenance: {
      locator:
        "git:abc123",

      nativeId:
        "abc123",

      repository:
        "kore20lllc-netizen/korelumina",

      ref:
        "feature/genesis-historical-replay",

      externalSource:
        false,
    },

    integrity: {
      checksum:
        "commit-checksum",

      acquisitionState:
        "available",
    },

    metadata: {
      files: [
        "apps/lumina-runtime/src/example.ts",
      ],
    },
  });
}

function conversationSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "conversation:C-123",

    sourceClass:
      "conversation",

    evidenceType:
      "conversation",

    sourceRevision:
      "message:M-456",

    provenance: {
      nativeId:
        "C-123:M-456",

      sourceReference:
        "EXTERNAL SOURCE — NOT YET INGESTED",

      externalSource:
        true,
    },

    integrity: {
      acquisitionState:
        "not-yet-ingested",
    },

    metadata: {
      projectAssociation:
        "KoreLumina",
    },
  });
}

function replayStatus():
  GenesisReplayStatusSnapshot {
  return {
    replayId:
      REPLAY_ID,

    found:
      true,

    manifestPresent:
      true,

    executionPresent:
      true,

    manifestId:
      "genesis-manifest:fixture",

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    totalManifestSources:
      3,

    executionStatus:
      "completed",

    corpusStatus:
      "COMPLETE",

    currentManifestIndex:
      null,

    currentHistoricalSourceId:
      null,

    lastCompletedManifestIndex:
      2,

    progress: {
      totalSources:
        3,

      completedSources:
        3,

      admittedSources:
        2,

      skippedSources:
        1,

      blockedSources:
        0,
    },

    checkpoint:
      null,

    runnerOutcome:
      "COMPLETED",

    runnerFailure:
      null,

    recovery: {
      eligible:
        false,

      reason:
        "ALREADY_COMPLETED",
    },

    admittedEvidenceIds: [
      "evidence:1",
      "evidence:2",
    ],

    admissionLinks: [
      {
        evidenceId:
          "evidence:1",

        manufacturingRunId:
          "manufacturing-run:1",

        linked:
          true,

        ambiguous:
          false,

        matchingManufacturingRunIds: [
          "manufacturing-run:1",
        ],

        status:
          "completed",

        currentStage:
          "Canonical Knowledge",

        packageId:
          "knowledge-package:1",

        canonicalKnowledgeIds: [
          "canonical:1",
        ],
      },

      {
        evidenceId:
          "evidence:2",

        manufacturingRunId:
          null,

        linked:
          false,

        ambiguous:
          false,

        matchingManufacturingRunIds:
          [],

        status:
          null,

        currentStage:
          null,

        packageId:
          null,

        canonicalKnowledgeIds:
          [],
      },
    ],

    allAdmittedEvidenceLinked:
      false,
  };
}

function fixture() {
  const commit =
    commitSource();

  const conversation =
    conversationSource();

  const implementation =
    createHistoricalEvent({
      kind:
        "implementation-committed",

      observationKey:
        "implementation:abc123",

      occurredAt:
        2_000,

      sourceReferenceIds: [
        commit.sourceReferenceId,
      ],

      sourceRevisionIds: [
        commit.sourceRevisionId,
      ],

      temporalAuthority:
        authority,

      metadata: {},
    });

  const request =
    createHistoricalEvent({
      kind:
        "requirement-stated",

      observationKey:
        "conversation:C-123:request",

      occurredAt:
        1_000,

      sourceReferenceIds: [
        conversation.sourceReferenceId,
      ],

      sourceRevisionIds: [
        conversation.sourceRevisionId,
      ],

      temporalAuthority:
        authority,

      metadata: {},
    });

  const chronology =
    createChronologicalRelationship({
      fromEventId:
        request.eventId,

      toEventId:
        implementation.eventId,

      sourceReferenceIds: [
        conversation.sourceReferenceId,
        commit.sourceReferenceId,
      ],

      assertion:
        "request occurred before implementation",
    });

  const episode =
    createEvolutionEpisode({
      episodeKey:
        "historical-corpus-fixture",

      title:
        "Historical Corpus Fixture",

      lifecycle:
        "correlated",

      eventIds: [
        request.eventId,
        implementation.eventId,
      ],

      relationshipIds: [
        chronology.relationshipId,
      ],

      sourceReferenceIds: [
        conversation.sourceReferenceId,
        commit.sourceReferenceId,
      ],

      externalContext:
        "pending",

      temporalAuthority:
        authority,

      lineage: {
        mergedFrom:
          [],

        supersedes:
          [],
      },

      metadata: {},
    });

  return {
    replayInventory: {
      total:
        1,

      replayIds: [
        REPLAY_ID,
      ],

      replays: [
        replayStatus(),
      ],
    },

    correlation: {
      sourceReferences: [
        commit,
        conversation,
      ],

      events: [
        implementation,
        request,
      ],

      relationships: [
        chronology,
      ],

      episodes: [
        episode,
      ],
    },
  };
}

test(
  "Genesis Corpus projection identity is deterministic",
  () => {
    const input =
      fixture();

    const first =
      buildGenesisCorpusReadModel(
        input,
      );

    const second =
      buildGenesisCorpusReadModel(
        input,
      );

    assert.equal(
      first.projectionId,
      second.projectionId,
    );
  },
);

test(
  "Genesis Corpus preserves independent source identities",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus.sources.length,
      2,
    );

    assert.equal(
      new Set(
        corpus.sources.map(
          (
            source,
          ) =>
            source.sourceReferenceId,
        ),
      ).size,
      2,
    );
  },
);

test(
  "Genesis Corpus exposes Source History and Evolution History together",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus
        .sourceSummary
        .uniqueSources,
      2,
    );

    assert.equal(
      corpus
        .evolutionSummary
        .historicalEvents,
      2,
    );

    assert.equal(
      corpus
        .evolutionSummary
        .relationships,
      1,
    );

    assert.equal(
      corpus
        .evolutionSummary
        .evolutionEpisodes,
      1,
    );
  },
);

test(
  "historical events are ordered chronologically without creating causality",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.ok(
      corpus.events[0]
        .occurredAt <
      corpus.events[1]
        .occurredAt,
    );

    assert.equal(
      corpus.relationships[0]
        .type,
      "occurred_before",
    );

    assert.equal(
      corpus.relationships[0]
        .causal,
      false,
    );
  },
);

test(
  "source records expose related events and episodes",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    for (
      const source
      of corpus.sources
    ) {
      assert.equal(
        source.eventIds.length,
        1,
      );

      assert.equal(
        source.episodeIds.length,
        1,
      );
    }
  },
);

test(
  "replay state remains distinct from Genesis Corpus projection identity",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus.replays.length,
      1,
    );

    assert.equal(
      corpus.replays[0]
        .replayId,
      REPLAY_ID,
    );

    assert.equal(
      corpus.replays[0]
        .replayCorpusStatus,
      "COMPLETE",
    );

    assert.match(
      corpus.projectionId,
      /^genesis-corpus-projection:/,
    );
  },
);

test(
  "Knowledge lifecycle reports only correlations actually proved by replay status",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .admittedEvidence,
      2,
    );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .manufacturingLinkedEvidence,
      1,
    );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .packages,
      1,
    );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .canonicalKnowledge,
      1,
    );
  },
);

test(
  "Canonical Knowledge does not imply Organizational Memory adaptation",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .canonicalKnowledge,
      1,
    );

    assert.deepEqual(
      corpus
        .knowledgeLifecycle
        .organizationalMemory,
      {
        status:
          "not-correlated",

        adaptedRecords:
          null,
      },
    );
  },
);

test(
  "Canonical Knowledge does not imply educational eligibility",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.deepEqual(
      corpus
        .knowledgeLifecycle
        .educationalEligibility,
      {
        status:
          "not-correlated",

        eligibleRecords:
          null,
      },
    );
  },
);

test(
  "external conversation gap remains visible",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    assert.equal(
      corpus
        .externalContext
        .notYetIngestedConversationSources,
      1,
    );

    assert.equal(
      corpus
        .externalContext
        .pendingEpisodes,
      1,
    );

    assert.equal(
      corpus
        .externalContext
        .complete,
      false,
    );
  },
);

test(
  "external conversation gap does not prevent repository-native corpus projection",
  () => {
    const corpus =
      buildGenesisCorpusReadModel(
        fixture(),
      );

    const commit =
      corpus.sources.find(
        (
          source,
        ) =>
          source.sourceClass ===
          "commit",
      );

    assert.ok(
      commit,
    );

    assert.equal(
      commit.externalSource,
      false,
    );

    assert.equal(
      corpus.replays.length,
      1,
    );
  },
);

test(
  "projection does not mutate correlation or replay inputs",
  () => {
    const input =
      fixture();

    const originalEventOrder =
      input.correlation
        .events
        .map(
          (
            event,
          ) =>
            event.eventId,
        );

    const originalSourceOrder =
      input.correlation
        .sourceReferences
        .map(
          (
            source,
          ) =>
            source.sourceRevisionId,
        );

    buildGenesisCorpusReadModel(
      input,
    );

    assert.deepEqual(
      input.correlation
        .events
        .map(
          (
            event,
          ) =>
            event.eventId,
        ),
      originalEventOrder,
    );

    assert.deepEqual(
      input.correlation
        .sourceReferences
        .map(
          (
            source,
          ) =>
            source.sourceRevisionId,
        ),
      originalSourceOrder,
    );
  },
);

test(
  "equivalent input ordering does not change Genesis Corpus projection identity",
  () => {
    const input =
      fixture();

    const first =
      buildGenesisCorpusReadModel(
        input,
      );

    const reordered = {
      replayInventory: {
        ...input.replayInventory,

        replayIds: [
          ...input
            .replayInventory
            .replayIds,
        ].reverse(),

        replays: [
          ...input
            .replayInventory
            .replays,
        ].reverse(),
      },

      correlation: {
        sourceReferences: [
          ...input
            .correlation
            .sourceReferences,
        ].reverse(),

        events: [
          ...input
            .correlation
            .events,
        ].reverse(),

        relationships: [
          ...input
            .correlation
            .relationships,
        ].reverse(),

        episodes: [
          ...input
            .correlation
            .episodes,
        ].reverse(),
      },
    };

    const second =
      buildGenesisCorpusReadModel(
        reordered,
      );

    assert.equal(
      second.projectionId,
      first.projectionId,
    );

    assert.deepEqual(
      second.replays,
      first.replays,
    );

    assert.deepEqual(
      second.sources,
      first.sources,
    );

    assert.deepEqual(
      second.events,
      first.events,
    );

    assert.deepEqual(
      second.relationships,
      first.relationships,
    );

    assert.deepEqual(
      second.episodes,
      first.episodes,
    );
  },
);

test(
  "material Episode revision changes Genesis Corpus projection identity",
  () => {
    const input =
      fixture();

    const first =
      buildGenesisCorpusReadModel(
        input,
      );

    const original =
      input
        .correlation
        .episodes[0];

    const revised =
      reviseEvolutionEpisode(
        original,
        {
          title:
            original.title,

          lifecycle:
            "validated",

          eventIds:
            original.eventIds,

          relationshipIds:
            original.relationshipIds,

          sourceReferenceIds:
            original.sourceReferenceIds,

          externalContext:
            "complete",

          temporalAuthority:
            original.temporalAuthority,

          metadata: {
            ...original.metadata,

            certification:
              "CERTIFIED",
          },
        },
      );

    const second =
      buildGenesisCorpusReadModel({
        replayInventory:
          input.replayInventory,

        correlation: {
          ...input.correlation,

          episodes: [
            revised,
          ],
        },
      });

    assert.equal(
      revised.episodeId,
      original.episodeId,
    );

    assert.notEqual(
      revised.revisionId,
      original.revisionId,
    );

    assert.notEqual(
      second.projectionId,
      first.projectionId,
    );
  },
);

test(
  "material governed replay state changes Genesis Corpus projection identity",
  () => {
    const input =
      fixture();

    const first =
      buildGenesisCorpusReadModel(
        input,
      );

    const existing =
      input
        .replayInventory
        .replays[0];

    const changed:
      GenesisReplayStatusSnapshot = {
        ...existing,

        corpusStatus:
          "PARTIAL",

        executionStatus:
          "running",

        admittedEvidenceIds: [
          "evidence:1",
        ],

        admissionLinks: [
          existing
            .admissionLinks[0],
        ],

        allAdmittedEvidenceLinked:
          true,
      };

    const second =
      buildGenesisCorpusReadModel({
        replayInventory: {
          ...input.replayInventory,

          replays: [
            changed,
          ],
        },

        correlation:
          input.correlation,
      });

    assert.notEqual(
      second.projectionId,
      first.projectionId,
    );

    assert.equal(
      second.replays[0]
        .replayCorpusStatus,
      "PARTIAL",
    );

    assert.equal(
      second
        .knowledgeLifecycle
        .admittedEvidence,
      1,
    );
  },
);
