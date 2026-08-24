import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationCorrelationCompleteness,
} from "../GenesisConversationCorrelationCompleteness.js";

import {
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalSourceReference,
} from "../GenesisHistoricalCorrelation.js";

import type {
  GenesisReplayCheckpointDisposition,
} from "../GenesisReplayCheckpoint.js";

import type {
  GenesisSourceManifestEntry,
} from "../GenesisSourceManifest.js";

import type {
  HistoricalSourceId,
} from "../HistoricalSource.js";


function conversationEntry(
  historicalSourceId:
    HistoricalSourceId,

  supersedes:
    readonly HistoricalSourceId[] =
      [],
): GenesisSourceManifestEntry {
  return {
    historicalSourceId,

    sourceType:
      "conversation",

    evidenceType:
      "conversation",

    authorityClass:
      "external-conversation-evidence",

    authorityOwner:
      "chatgpt-data-export",

    authorityScope:
      "korelumina",

    authorityVersion:
      "1",

    provenanceLocator:
      `chatgpt://${historicalSourceId}`,

    sourceChecksum:
      `checksum:${historicalSourceId}`,

    historicalTimestamp:
      200,

    historicalTimestampSource:
      "conversation",

    discoveredAt:
      300,

    discoveryMethod:
      "chatgpt-export",

    replayEligibility:
      "eligible",

    supersedes,

    conflictsWith:
      [],

    metadata:
      {},
  };
}


function admitted(
  historicalSourceId:
    HistoricalSourceId,
): GenesisReplayCheckpointDisposition {
  return {
    historicalSourceId,

    disposition:
      "ADMITTED",

    evidenceId:
      `evidence:${historicalSourceId}`,
  };
}


test(
  "complete projection requires admitted conversation source and event correlation",
  () => {
    const conversationId =
      "genesis-source:conversation:one" as
        HistoricalSourceId;

    const entry =
      conversationEntry(
        conversationId,
      );

    const source =
      createHistoricalSourceReference({
        sourceIdentity:
          "conversation-one",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        sourceRevision:
          entry.sourceChecksum,

        provenance: {
          locator:
            entry.provenanceLocator,

          externalSource:
            true,
        },

        integrity: {
          checksum:
            entry.sourceChecksum,

          acquisitionState:
            "acquired",
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const event =
      createHistoricalEvent({
        kind:
          "requirement-stated",

        observationKey:
          conversationId,

        occurredAt:
          200,

        sourceReferenceIds: [
          source.sourceReferenceId,
        ],

        sourceRevisionIds: [
          source.sourceRevisionId,
        ],

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",
          },

          current: {
            status:
              "unknown",
          },
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const projection =
      buildGenesisConversationCorrelationCompleteness({
        manifestEntries: [
          entry,
        ],

        dispositions: [
          admitted(
            conversationId,
          ),
        ],

        correlation: {
          sourceReferences: [
            source,
          ],

          events: [
            event,
          ],

          relationships:
            [],

          episodes:
            [],
        },
      });

    assert.equal(
      projection.state,
      "COMPLETE",
    );

    assert.equal(
      projection.correlatedConversationSources,
      1,
    );

    assert.equal(
      projection.correlatedConversationEvents,
      1,
    );

    assert.equal(
      projection.dayZeroGenesisCertified,
      false,
    );
  },
);


test(
  "eligible conversation missing terminal admission is incomplete",
  () => {
    const conversationId =
      "genesis-source:conversation:one" as
        HistoricalSourceId;

    const projection =
      buildGenesisConversationCorrelationCompleteness({
        manifestEntries: [
          conversationEntry(
            conversationId,
          ),
        ],

        dispositions:
          [],

        correlation: {
          sourceReferences:
            [],

          events:
            [],

          relationships:
            [],

          episodes:
            [],
        },
      });

    assert.equal(
      projection.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      projection.missingAdmissionHistoricalSourceIds,
      [
        conversationId,
      ],
    );
  },
);


test(
  "explicit relationship target absent from manifest and correlation remains unresolved",
  () => {
    const conversationId =
      "genesis-source:conversation:one" as
        HistoricalSourceId;

    const missingTarget =
      "genesis-source:commit:missing" as
        HistoricalSourceId;

    const entry =
      conversationEntry(
        conversationId,
        [
          missingTarget,
        ],
      );

    const source =
      createHistoricalSourceReference({
        sourceIdentity:
          "conversation-one",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        sourceRevision:
          entry.sourceChecksum,

        provenance: {
          locator:
            entry.provenanceLocator,

          externalSource:
            true,
        },

        integrity: {
          checksum:
            entry.sourceChecksum,

          acquisitionState:
            "acquired",
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const event =
      createHistoricalEvent({
        kind:
          "requirement-stated",

        observationKey:
          conversationId,

        occurredAt:
          200,

        sourceReferenceIds: [
          source.sourceReferenceId,
        ],

        sourceRevisionIds: [
          source.sourceRevisionId,
        ],

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",
          },

          current: {
            status:
              "unknown",
          },
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const projection =
      buildGenesisConversationCorrelationCompleteness({
        manifestEntries: [
          entry,
        ],

        dispositions: [
          admitted(
            conversationId,
          ),
        ],

        correlation: {
          sourceReferences: [
            source,
          ],

          events: [
            event,
          ],

          relationships:
            [],

          episodes:
            [],
        },
      });

    assert.equal(
      projection.state,
      "INCOMPLETE",
    );

    assert.equal(
      projection.unresolvedExplicitLinks.length,
      1,
    );

    assert.equal(
      projection.unresolvedExplicitLinks[0]
        .targetHistoricalSourceId,
      missingTarget,
    );
  },
);


test(
  "cross-replay enriched episode must preserve previous revision lineage",
  () => {
    const conversationId =
      "genesis-source:conversation:one" as
        HistoricalSourceId;

    const entry =
      conversationEntry(
        conversationId,
      );

    const source =
      createHistoricalSourceReference({
        sourceIdentity:
          "conversation-one",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        sourceRevision:
          entry.sourceChecksum,

        provenance: {
          locator:
            entry.provenanceLocator,

          externalSource:
            true,
        },

        integrity: {
          checksum:
            entry.sourceChecksum,

          acquisitionState:
            "acquired",
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const event =
      createHistoricalEvent({
        kind:
          "requirement-stated",

        observationKey:
          conversationId,

        occurredAt:
          200,

        sourceReferenceIds: [
          source.sourceReferenceId,
        ],

        sourceRevisionIds: [
          source.sourceRevisionId,
        ],

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",
          },

          current: {
            status:
              "unknown",
          },
        },

        metadata: {
          historicalSourceId:
            conversationId,
        },
      });

    const episode =
      createEvolutionEpisode({
        episodeKey:
          "conversation-enrichment",

        title:
          "Conversation enrichment",

        lifecycle:
          "correlated",

        eventIds: [
          event.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          source.sourceReferenceId,
        ],

        externalContext:
          "complete",

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",
          },

          current: {
            status:
              "unknown",
          },
        },

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {
          revisionIntegrationMode:
            "cross-source-episode-enrichment",
        },
      });

    const projection =
      buildGenesisConversationCorrelationCompleteness({
        manifestEntries: [
          entry,
        ],

        dispositions: [
          admitted(
            conversationId,
          ),
        ],

        correlation: {
          sourceReferences: [
            source,
          ],

          events: [
            event,
          ],

          relationships:
            [],

          episodes: [
            episode,
          ],
        },
      });

    assert.equal(
      projection.state,
      "INCOMPLETE",
    );

    assert.equal(
      projection.episodeLineageGaps.length,
      1,
    );

    assert.ok(
      projection.blockers.includes(
        "cross-replay-episode-lineage-incomplete",
      ),
    );
  },
);
