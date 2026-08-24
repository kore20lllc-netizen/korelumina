import assert from "node:assert/strict";
import test from "node:test";

import {
  acquireGenesisHistoricalConversation,
} from "../GenesisConversationAcquisition.js";


function conversation() {
  return {
    conversationId:
      "conversation-001",

    projectId:
      "korelumina",

    title:
      "KoreLumina architecture discussion",

    createdAt:
      100,

    updatedAt:
      300,

    sourceRevision:
      "export-revision-1",

    acquisition: {
      provider:
        "chatgpt",

      acquisitionMethod:
        "governed-conversation-import",

      acquiredAt:
        1000,

      sourceLocator:
        "chatgpt-export://conversation-001",

      exportId:
        "export-001",

      exportRevision:
        "1",
    },

    privacy: {
      sensitivity:
        "standard" as const,

      containsPersonalData:
        false,
    },

    messages: [
      {
        messageId:
          "message-002",

        role:
          "assistant" as const,

        order:
          1,

        timestamp:
          200,

        availability:
          "available" as const,

        content:
          "Second message.",
      },

      {
        messageId:
          "message-001",

        role:
          "user" as const,

        order:
          0,

        timestamp:
          100,

        availability:
          "available" as const,

        content:
          "First message.",
      },

      {
        messageId:
          "message-003",

        role:
          "user" as const,

        order:
          2,

        timestamp:
          300,

        availability:
          "deleted" as const,
      },
    ],
  };
}


test(
  "materializes conversation messages deterministically in authoritative order",
  () => {
    const first =
      acquireGenesisHistoricalConversation(
        conversation(),
      );

    const second =
      acquireGenesisHistoricalConversation(
        conversation(),
      );

    assert.deepEqual(
      first,
      second,
    );

    assert.deepEqual(
      first.messages.map(
        (
          item,
        ) =>
          item.evidence.metadata.messageId,
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
  "materializes independent conversation HistoricalSource and Evidence identities",
  () => {
    const result =
      acquireGenesisHistoricalConversation(
        conversation(),
      );

    const first =
      result.messages[0];

    assert.equal(
      first
        .historicalSource
        .sourceClass,
      "conversation",
    );

    assert.equal(
      first
        .historicalSource
        .evidenceType,
      "conversation",
    );

    assert.equal(
      first
        .evidence
        .type,
      "conversation",
    );

    assert.equal(
      first
        .evidence
        .metadata
        .historicalSourceId,
      first
        .historicalSource
        .historicalSourceId,
    );
  },
);


test(
  "preserves speaker identity ordering timestamps provenance and project association",
  () => {
    const result =
      acquireGenesisHistoricalConversation(
        conversation(),
      );

    const first =
      result.messages[0];

    assert.equal(
      first
        .historicalSource
        .metadata
        .speakerRole,
      "user",
    );

    assert.equal(
      first
        .historicalSource
        .metadata
        .messageOrder,
      0,
    );

    assert.equal(
      first
        .historicalSource
        .historicalTimestamp
        .value,
      100,
    );

    assert.equal(
      first
        .historicalSource
        .metadata
        .projectId,
      "korelumina",
    );

    assert.match(
      first
        .historicalSource
        .provenance
        .locator,
      /message=message-001/,
    );
  },
);


test(
  "preserves unavailable historical segments without fabricating content",
  () => {
    const result =
      acquireGenesisHistoricalConversation(
        conversation(),
      );

    const missing =
      result.messages[2];

    assert.equal(
      missing
        .historicalSource
        .replayEligibility,
      "blocked",
    );

    assert.equal(
      missing
        .historicalSource
        .metadata
        .segmentAvailability,
      "deleted",
    );

    assert.equal(
      missing
        .evidence
        .metadata
        .content,
      "",
    );

    assert.equal(
      missing
        .historicalSource
        .exclusionReason,
      "conversation-segment-deleted",
    );
  },
);


test(
  "source revision changes integrity without changing native source identity",
  () => {
    const firstInput =
      conversation();

    const secondInput =
      conversation();

    secondInput.sourceRevision =
      "export-revision-2";

    const first =
      acquireGenesisHistoricalConversation(
        firstInput,
      );

    const second =
      acquireGenesisHistoricalConversation(
        secondInput,
      );

    assert.equal(
      first.messages[0]
        .historicalSource
        .historicalSourceId,
      second.messages[0]
        .historicalSource
        .historicalSourceId,
    );

    assert.notEqual(
      first.messages[0]
        .historicalSource
        .sourceChecksum,
      second.messages[0]
        .historicalSource
        .sourceChecksum,
    );

    assert.notEqual(
      first.messages[0]
        .evidence
        .id,
      second.messages[0]
        .evidence
        .id,
    );
  },
);


test(
  "rejects duplicate message identities",
  () => {
    const input =
      conversation();

    input.messages[1].messageId =
      "message-002";

    assert.throws(
      () =>
        acquireGenesisHistoricalConversation(
          input,
        ),
      /duplicate_message_identity/,
    );
  },
);


test(
  "rejects duplicate message ordering",
  () => {
    const input =
      conversation();

    input.messages[1].order =
      1;

    assert.throws(
      () =>
        acquireGenesisHistoricalConversation(
          input,
        ),
      /duplicate_message_order/,
    );
  },
);


test(
  "does not permit fabricated content for unavailable segments",
  () => {
    const input =
      conversation();

    input.messages[2].content =
      "Reconstructed from Git.";

    assert.throws(
      () =>
        acquireGenesisHistoricalConversation(
          input,
        ),
      /unavailable_message_content_forbidden/,
    );
  },
);
