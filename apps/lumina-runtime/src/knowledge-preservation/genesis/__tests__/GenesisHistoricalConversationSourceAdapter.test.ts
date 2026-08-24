import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayScope,
} from "../GenesisSourceManifest.js";

import {
  GenesisHistoricalConversationSourceAdapter,
} from "../GenesisHistoricalConversationSourceAdapter.js";

import type {
  GenesisHistoricalConversationSource,
} from "../GenesisHistoricalConversationSourceAdapter.js";


function scope():
  GenesisReplayScope {
  return {
    mode:
      "full",

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


function source():
  GenesisHistoricalConversationSource {
  return {
    id:
      "chatgpt-project-history",

    async acquire() {
      return {
        acquisitionId:
          "acquisition-001",

        acquiredAt:
          1000,

        gaps: [
          {
            state:
              "historically-unavailable",

            conversationId:
              "conversation-lost",

            sourceLocator:
              "chatgpt://conversation-lost",

            detail:
              "Conversation is known to have existed but is no longer recoverable.",
          },
        ],

        conversations: [
          {
            conversationId:
              "conversation-001",

            projectId:
              "korelumina",

            title:
              "Architecture discussion",

            createdAt:
              100,

            sourceRevision:
              "1",

            acquisition: {
              provider:
                "chatgpt",

              acquisitionMethod:
                "governed-chatgpt-history",

              acquiredAt:
                1000,

              sourceLocator:
                "chatgpt://conversation-001",
            },

            privacy: {
              sensitivity:
                "standard",

              containsPersonalData:
                false,
            },

            messages: [
              {
                messageId:
                  "message-002",

                role:
                  "assistant",

                order:
                  1,

                timestamp:
                  200,

                availability:
                  "available",

                content:
                  "Implementation response.",
              },

              {
                messageId:
                  "message-001",

                role:
                  "user",

                order:
                  0,

                timestamp:
                  100,

                availability:
                  "available",

                content:
                  "Architecture requirement.",
              },

              {
                messageId:
                  "message-003",

                role:
                  "user",

                order:
                  2,

                timestamp:
                  300,

                availability:
                  "missing",
              },
            ],
          },
        ],
      };
    },
  };
}


test(
  "adapter owns conversation HistoricalSource discovery",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    assert.deepEqual(
      adapter.sourceClasses,
      [
        "conversation",
      ],
    );

    const result =
      await adapter.discover(
        scope(),
      );

    assert.equal(
      result.discovererId,
      "conversation-source:chatgpt-project-history",
    );

    assert.equal(
      result.sources.length,
      3,
    );
  },
);


test(
  "conversation messages enter discovery in historical order",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const result =
      await adapter.discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          historicalSource,
        ) =>
          historicalSource
            .metadata
            .messageId,
      ),
      [
        "message-001",
        "message-002",
        "message-003",
      ],
    );
  },
);


test(
  "adapter retains acquired Evidence independently from HistoricalSource",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const result =
      await adapter.discover(
        scope(),
      );

    const historicalSource =
      result.sources[0];

    const evidence =
      adapter.evidenceForHistoricalSource(
        historicalSource.historicalSourceId,
      );

    assert.ok(
      evidence,
    );

    assert.equal(
      evidence.type,
      "conversation",
    );

    assert.equal(
      evidence.metadata.content,
      "Architecture requirement.",
    );

    assert.equal(
      evidence.metadata.historicalSourceId,
      historicalSource.historicalSourceId,
    );
  },
);


test(
  "missing message is preserved as blocked history without fabricated content",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const result =
      await adapter.discover(
        scope(),
      );

    const missing =
      result.sources.find(
        (
          historicalSource,
        ) =>
          historicalSource
            .metadata
            .messageId ===
          "message-003",
      );

    assert.ok(
      missing,
    );

    assert.equal(
      missing.replayEligibility,
      "blocked",
    );

    assert.equal(
      missing.exclusionReason,
      "conversation-segment-missing",
    );

    const evidence =
      adapter.evidenceForHistoricalSource(
        missing.historicalSourceId,
      );

    assert.ok(
      evidence,
    );

    assert.equal(
      evidence.metadata.content,
      "",
    );
  },
);


test(
  "historically unavailable conversation remains a visible acquisition gap",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const result =
      await adapter.discover(
        scope(),
      );

    assert.equal(
      result.errors.length,
      1,
    );

    assert.equal(
      result.errors[0].code,
      "SOURCE_UNAVAILABLE",
    );

    assert.equal(
      result.errors[0].cause,
      "historically-unavailable",
    );

    assert.equal(
      result.errors[0].provenanceLocator,
      "chatgpt://conversation-lost",
    );
  },
);


test(
  "not acquired and historically unavailable are not collapsed",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source: {
          id:
            "gap-source",

          async acquire() {
            return {
              acquisitionId:
                "gap-acquisition",

              acquiredAt:
                1000,

              conversations:
                [],

              gaps: [
                {
                  state:
                    "not-yet-acquired",

                  detail:
                    "Export not acquired yet.",
                },

                {
                  state:
                    "historically-unavailable",

                  detail:
                    "Known historical conversation cannot be recovered.",
                },
              ],
            };
          },
        },
      });

    const result =
      await adapter.discover(
        scope(),
      );

    assert.deepEqual(
      result.errors.map(
        (
          error,
        ) =>
          error.cause,
      ),
      [
        "historically-unavailable",
        "not-yet-acquired",
      ],
    );
  },
);


test(
  "replay scope excludes conversation without erasing discovered source",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const excludedScope =
      scope();

    excludedScope.includedEvidenceTypes =
      [];

    const result =
      await adapter.discover(
        excludedScope,
      );

    assert.equal(
      result.sources.length,
      3,
    );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "excluded",
    );

    assert.equal(
      result.sources[0]
        .exclusionReason,
      "evidence_type_outside_replay_scope",
    );

    /*
     * Missing historical segments remain blocked rather than being
     * rewritten as ordinary scope exclusions.
     */
    assert.equal(
      result.sources[2]
        .replayEligibility,
      "blocked",
    );
  },
);


test(
  "source acquisition failure fails closed as SOURCE_UNAVAILABLE",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source: {
          id:
            "unavailable",

          async acquire() {
            throw new Error(
              "external export unavailable",
            );
          },
        },
      });

    const result =
      await adapter.discover(
        scope(),
      );

    assert.deepEqual(
      result.sources,
      [],
    );

    assert.equal(
      result.errors.length,
      1,
    );

    assert.equal(
      result.errors[0].code,
      "SOURCE_UNAVAILABLE",
    );

    assert.match(
      result.errors[0].cause ?? "",
      /external export unavailable/,
    );
  },
);


test(
  "repeated acquisition is deterministic and does not duplicate Evidence custody",
  async () => {
    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source:
          source(),
      });

    const first =
      await adapter.discover(
        scope(),
      );

    const second =
      await adapter.discover(
        scope(),
      );

    assert.deepEqual(
      first.sources,
      second.sources,
    );

    assert.equal(
      adapter
        .listAcquiredEvidence()
        .length,
      3,
    );
  },
);
