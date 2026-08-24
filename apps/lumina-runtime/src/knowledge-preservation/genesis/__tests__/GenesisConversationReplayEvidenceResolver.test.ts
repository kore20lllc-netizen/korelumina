import assert from "node:assert/strict";
import test from "node:test";

import {
  PersistedGenesisConversationReplayEvidenceResolver,
} from "../GenesisConversationReplayEvidenceResolver.js";

import type {
  GenesisConversationAcquisitionRecord,
} from "../GenesisConversationAcquisitionExecution.js";


function acquisition():
  GenesisConversationAcquisitionRecord {
  const historicalSourceId =
    "genesis-historical-source:conversation:test" as
      GenesisConversationAcquisitionRecord[
        "historicalSources"
      ][number]["historicalSourceId"];

  return {
    acquisitionId:
      "acquisition-001",

    state:
      "ACQUIRED",

    sourceId:
      "chatgpt",

    firstAcquiredAt:
      100,

    lastAcquiredAt:
      100,

    completedAt:
      101,

    occurrenceCount:
      1,

    occurrences: [
      {
        acquiredAt:
          100,

        completedAt:
          101,
      },
    ],

    conversationIds: [
      "conversation-001",
    ],

    gaps:
      [],

    conversationCount:
      1,

    historicalSourceCount:
      1,

    evidenceCount:
      1,

    errors:
      [],

    historicalSources: [
      {
        historicalSourceId,

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        stableSourceKey:
          "conversation:test",

        sourceChecksum:
          "checksum-001",

        provenance: {
          locator:
            "chatgpt://conversation-001/message-001",
        },

        historicalTimestamp: {
          value:
            10,

          source:
            "conversation",
        },

        discoveredAt:
          100,

        discoveryMethod:
          "test",

        authority: {
          authorityClass:
            "external-conversation-evidence",
        },

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata:
          {},
      },
    ],

    evidence: [
      {
        id:
          "conversation-evidence-001",

        type:
          "conversation",

        title:
          "Historical conversation",

        source:
          "chatgpt",

        capturedAt:
          100,

        observedAt:
          10,

        contentRef:
          "chatgpt://conversation-001/message-001",

        checksum:
          "checksum-001",

        metadata: {
          historicalSourceId,

          content:
            "Original conversation payload.",
        },

        relationships: {
          historicalSource: [
            historicalSourceId,
          ],
        },
      },
    ],
  };
}


test(
  "resolves original acquired Evidence by HistoricalSource identity",
  () => {
    const record =
      acquisition();

    const resolver =
      new PersistedGenesisConversationReplayEvidenceResolver({
        acquisition: {
          loadLatest:
            () =>
              record,
        },
      });

    const result =
      resolver.resolve(
        record
          .historicalSources[0]
          .historicalSourceId,
      );

    assert.ok(
      result,
    );

    assert.equal(
      result.id,
      "conversation-evidence-001",
    );

    assert.equal(
      result.metadata.content,
      "Original conversation payload.",
    );
  },
);


test(
  "failed or absent acquisition cannot resolve replay Evidence",
  () => {
    const resolver =
      new PersistedGenesisConversationReplayEvidenceResolver({
        acquisition: {
          loadLatest:
            () =>
              null,
        },
      });

    assert.equal(
      resolver.resolve(
        "genesis-historical-source:conversation:missing" as never,
      ),
      null,
    );
  },
);
