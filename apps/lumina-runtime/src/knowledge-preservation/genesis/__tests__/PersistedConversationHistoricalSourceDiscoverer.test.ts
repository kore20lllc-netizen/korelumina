import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisConversationAcquisitionRecord,
} from "../GenesisConversationAcquisitionExecution.js";

import {
  PersistedConversationHistoricalSourceDiscoverer,
} from "../PersistedConversationHistoricalSourceDiscoverer.js";

import {
  buildGenesisSourceManifest,
} from "../GenesisSourceManifestBuilder.js";

import type {
  GenesisReplayScope,
} from "../GenesisSourceManifest.js";


function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "korelumina",

    includedEvidenceTypes: [
      "conversation",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "test-v1",

    replayContractVersion:
      "1.0",
  };
}


function acquired():
  GenesisConversationAcquisitionRecord {
  const historicalSourceId =
    "conversation-source:test-message" as
      GenesisConversationAcquisitionRecord[
        "historicalSources"
      ][number]["historicalSourceId"];

  return {
    acquisitionId:
      "acquisition-test",

    state:
      "ACQUIRED",

    sourceId:
      "test-source",

    firstAcquiredAt:
      1000,

    lastAcquiredAt:
      1000,

    completedAt:
      1001,

    occurrenceCount:
      1,

    occurrences: [
      {
        acquiredAt:
          1000,

        completedAt:
          1001,
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
          "conversation:chatgpt:conversation-001:message:message-001",

        sourceChecksum:
          "checksum-001",

        provenance: {
          locator:
            "chatgpt-export://conversations.json#conversation=conversation-001&message=message-001",

          nativeId:
            "message-001",
        },

        historicalTimestamp: {
          value:
            100,

          source:
            "authoritative-conversation-message-timestamp",
        },

        discoveredAt:
          1000,

        discoveryMethod:
          "chatgpt-export-json-v1",

        authority: {
          authorityClass:
            "external-conversation-evidence",

          owner:
            "chatgpt-data-export",

          scope:
            "korelumina",

          version:
            "revision-1",
        },

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          conversationId:
            "conversation-001",

          messageId:
            "message-001",

          speakerRole:
            "user",

          messageOrder:
            0,
        },
      },
    ],

    evidence: [
      {
        id:
          "evidence-001",

        type:
          "conversation",

        title:
          "Conversation message",

        source:
          "chatgpt-data-export",

        capturedAt:
          1000,

        observedAt:
          100,

        contentRef:
          "chatgpt-export://conversations.json#conversation=conversation-001&message=message-001",

        checksum:
          "checksum-001",

        metadata: {
          historicalSourceId,

          content:
            "Historical requirement.",
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
  "discovers persisted acquired conversation HistoricalSource",
  async () => {
    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () =>
              acquired(),
        },
      });

    const result =
      await discoverer.discover(
        scope(),
      );

    assert.equal(
      result.sources.length,
      1,
    );

    assert.equal(
      result.sources[0].sourceClass,
      "conversation",
    );

    assert.equal(
      result.errors.length,
      0,
    );
  },
);


test(
  "conversation source becomes a normal Genesis manifest entry",
  async () => {
    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () =>
              acquired(),
        },
      });

    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoveredAt:
          2000,

        discoverers: [
          discoverer,
        ],
      });

    assert.equal(
      result.readiness,
      "READY",
    );

    assert.equal(
      result.manifest.entries.length,
      1,
    );

    assert.equal(
      result.manifest.entries[0]
        .evidenceType,
      "conversation",
    );

    assert.equal(
      result.discovererIds[0],
      "persisted-conversation-history-v1",
    );
  },
);


test(
  "missing persisted acquisition blocks conversation manifest discovery",
  async () => {
    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () =>
              null,
        },
      });

    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoveredAt:
          2000,

        discoverers: [
          discoverer,
        ],
      });

    assert.equal(
      result.readiness,
      "BLOCKED",
    );

    assert.equal(
      result.errors[0].code,
      "SOURCE_UNAVAILABLE",
    );
  },
);


test(
  "failed persisted acquisition blocks conversation manifest discovery",
  async () => {
    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () => ({
              state:
                "FAILED",

              attemptedAt:
                1000,

              failedAt:
                1001,

              error:
                "export unavailable",
            }),
        },
      });

    const result =
      await discoverer.discover(
        scope(),
      );

    assert.equal(
      result.sources.length,
      0,
    );

    assert.equal(
      result.errors[0].cause,
      "export unavailable",
    );
  },
);


test(
  "scope excluding conversation does not require conversation acquisition",
  async () => {
    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () =>
              null,
        },
      });

    const excluded =
      scope();

    excluded.includedEvidenceTypes =
      [];

    const result =
      await discoverer.discover(
        excluded,
      );

    assert.deepEqual(
      result.sources,
      [],
    );

    assert.deepEqual(
      result.errors,
      [],
    );
  },
);


test(
  "persisted HistoricalSource without independent Evidence custody fails closed",
  async () => {
    const record =
      acquired();

    const corrupted = {
      ...record,

      evidence:
        [],
    };

    const discoverer =
      new PersistedConversationHistoricalSourceDiscoverer({
        acquisition: {
          loadLatest:
            () =>
              corrupted,
        },
      });

    await assert.rejects(
      () =>
        discoverer.discover(
          scope(),
        ),
      /evidence_custody_missing/,
    );
  },
);
