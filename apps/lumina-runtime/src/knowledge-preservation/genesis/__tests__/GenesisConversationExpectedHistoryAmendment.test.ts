import assert from "node:assert/strict";
import test from "node:test";

import {
  amendGenesisConversationExpectedHistory,
} from "../GenesisConversationExpectedHistoryAmendment.js";

import {
  buildGenesisConversationExpectedHistoryInventory,
  reconcileGenesisConversationExpectedHistory,
} from "../GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";


function current() {
  return buildGenesisConversationExpectedHistoryInventory({
    authority: {
      authorityId:
        "authority:test",

      authorityClass:
        "governance",

      certifiedBy:
        "reviewer",

      certifiedAt:
        100,

      scope:
        "day-zero-conversation-history",

      version:
        "v1",
    },

    historicalStart:
      10,

    historicalEnd:
      90,

    conversations: [
      {
        conversationId:
          "conversation-001",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "certified expected history",
      },

      {
        conversationId:
          "conversation-002",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "certified expected history",
      },
    ],
  });
}


function acquired(
  conversationIds:
    readonly string[],
): GenesisConversationAcquisitionInventory {
  return {
    inventoryId:
      "genesis-conversation-acquisition-inventory:test",

    historyState:
      "ACQUIRED",

    completeness:
      "UNVERIFIED",

    configured:
      true,

    acquisitionAvailable:
      true,

    acquisitionId:
      "genesis-conversation-acquisition:test",

    acquiredConversationIds: [
      ...conversationIds,
    ],

    conversationCount:
      conversationIds.length,

    historicalSourceCount:
      conversationIds.length,

    evidenceCount:
      conversationIds.length,

    gapCounts: {
      notYetAcquired:
        0,

      historicallyUnavailable:
        0,

      permissionBlocked:
        0,

      sourceUnavailable:
        0,
    },

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],

    historicalCompletenessCertified:
      false,
  };
}


test(
  "governed amendment adds an already-acquired unexpected conversation without removing existing authority",
  () => {
    const before =
      current();

    const acquisition =
      acquired([
        "conversation-001",
        "conversation-002",
        "conversation-unexpected",
      ]);

    const amendment =
      amendGenesisConversationExpectedHistory({
        current:
          before,

        acquired:
          acquisition,

        decision: {
          conversationId:
            "conversation-unexpected",

          amendedBy:
            "human-governor",

          amendedAt:
            200,

          reason:
            "Legitimate historical conversation acquired after authoritative inventory creation.",
        },
      });

    assert.equal(
      amendment.previousInventoryId,
      before.inventoryId,
    );

    assert.notEqual(
      amendment.amendedInventoryId,
      before.inventoryId,
    );

    assert.deepEqual(
      amendment.inventory.authority,
      before.authority,
    );

    assert.deepEqual(
      amendment.inventory
        .conversations
        .map(
          item =>
            item.conversationId,
        ),
      [
        "conversation-001",
        "conversation-002",
        "conversation-unexpected",
      ],
    );

    assert.equal(
      amendment.inventory
        .conversations
        .find(
          item =>
            item.conversationId ===
            "conversation-unexpected",
        )
        ?.disposition,
      "EXPECTED_RECOVERABLE",
    );

    const after =
      reconcileGenesisConversationExpectedHistory({
        expected:
          amendment.inventory,

        acquired:
          acquisition,
      });

    assert.deepEqual(
      after.unexpectedAcquiredConversationIds,
      [],
    );

    assert.deepEqual(
      after.notYetAcquiredConversationIds,
      [],
    );

    assert.equal(
      after.state,
      "COMPLETE",
    );
  },
);


test(
  "amendment is deterministic for the same governed decision",
  () => {
    const before =
      current();

    const acquisition =
      acquired([
        "conversation-001",
        "conversation-002",
        "conversation-unexpected",
      ]);

    const input = {
      current:
        before,

      acquired:
        acquisition,

      decision: {
        conversationId:
          "conversation-unexpected",

        amendedBy:
          "human-governor",

        amendedAt:
          200,

        reason:
          "Legitimate post-creation historical acquisition.",
      },
    } as const;

    const first =
      amendGenesisConversationExpectedHistory(
        input,
      );

    const second =
      amendGenesisConversationExpectedHistory(
        input,
      );

    assert.equal(
      first.amendmentId,
      second.amendmentId,
    );

    assert.equal(
      first.amendedInventoryId,
      second.amendedInventoryId,
    );

    assert.deepEqual(
      first,
      second,
    );
  },
);


test(
  "amendment refuses a conversation that has not been acquired",
  () => {
    assert.throws(
      () =>
        amendGenesisConversationExpectedHistory({
          current:
            current(),

          acquired:
            acquired([
              "conversation-001",
              "conversation-002",
            ]),

          decision: {
            conversationId:
              "conversation-not-acquired",

            amendedBy:
              "human-governor",

            amendedAt:
              200,

            reason:
              "invalid amendment",
          },
        }),
      /genesis_conversation_expected_history_amendment_conversation_not_acquired/,
    );
  },
);


test(
  "amendment refuses an acquired conversation already governed by expected history",
  () => {
    assert.throws(
      () =>
        amendGenesisConversationExpectedHistory({
          current:
            current(),

          acquired:
            acquired([
              "conversation-001",
              "conversation-002",
            ]),

          decision: {
            conversationId:
              "conversation-001",

            amendedBy:
              "human-governor",

            amendedAt:
              200,

            reason:
              "duplicate authority attempt",
          },
        }),
      /genesis_conversation_expected_history_amendment_conversation_not_unexpected/,
    );
  },
);


test(
  "amendment requires explicit human governance metadata",
  () => {
    const before =
      current();

    const acquisition =
      acquired([
        "conversation-001",
        "conversation-002",
        "conversation-unexpected",
      ]);

    assert.throws(
      () =>
        amendGenesisConversationExpectedHistory({
          current:
            before,

          acquired:
            acquisition,

          decision: {
            conversationId:
              "conversation-unexpected",

            amendedBy:
              " ",

            amendedAt:
              200,

            reason:
              "valid reason",
          },
        }),
      /genesis_conversation_expected_history_amendment_actor_required/,
    );

    assert.throws(
      () =>
        amendGenesisConversationExpectedHistory({
          current:
            before,

          acquired:
            acquisition,

          decision: {
            conversationId:
              "conversation-unexpected",

            amendedBy:
              "human-governor",

            amendedAt:
              200,

            reason:
              " ",
          },
        }),
      /genesis_conversation_expected_history_amendment_reason_required/,
    );
  },
);
