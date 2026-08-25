import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationExpectedHistoryInventory,
  reconcileGenesisConversationExpectedHistory,
} from "../GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";


function expectedInventory() {
  return buildGenesisConversationExpectedHistoryInventory({
    authority: {
      authorityId:
        "korelumina-day-zero-conversation-inventory",

      authorityClass:
        "human-certified-institutional-history",

      certifiedBy:
        "korelumina-human-governance",

      certifiedAt:
        1000,

      scope:
        "korelumina-day-zero-through-present",

      version:
        "1",
    },

    historicalStart:
      0,

    historicalEnd:
      1000,

    conversations: [
      {
        conversationId:
          "conversation-001",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "authoritative exported conversation inventory",
      },

      {
        conversationId:
          "conversation-002",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "authoritative exported conversation inventory",
      },

      {
        conversationId:
          "conversation-lost",

        disposition:
          "HISTORICALLY_UNAVAILABLE",

        basis:
          "human-certified historical gap",
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
      "acquisition-001",

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
  "expected history identity is deterministic",
  () => {
    const first =
      expectedInventory();

    const second =
      expectedInventory();

    assert.equal(
      first.inventoryId,
      second.inventoryId,
    );
  },
);


test(
  "duplicate expected conversation identities are rejected",
  () => {
    assert.throws(
      () =>
        buildGenesisConversationExpectedHistoryInventory({
          authority:
            expectedInventory()
              .authority,

          conversations: [
            {
              conversationId:
                "duplicate",

              disposition:
                "EXPECTED_RECOVERABLE",

              basis:
                "first declaration",
            },

            {
              conversationId:
                "duplicate",

              disposition:
                "HISTORICALLY_UNAVAILABLE",

              basis:
                "conflicting declaration",
            },
          ],
        }),
      /duplicate_conversation/,
    );
  },
);


test(
  "complete reconciliation certifies acquired expected history while preserving declared unavailable gaps",
  () => {
    const reconciliation =
      reconcileGenesisConversationExpectedHistory({
        expected:
          expectedInventory(),

        acquired:
          acquired([
            "conversation-001",
            "conversation-002",
          ]),
      });

    assert.equal(
      reconciliation.state,
      "COMPLETE",
    );

    assert.equal(
      reconciliation.dayZeroConversationCoverageCertified,
      false,
    );

    assert.deepEqual(
      reconciliation.historicallyUnavailableConversationIds,
      [
        "conversation-lost",
      ],
    );

    assert.deepEqual(
      reconciliation.notYetAcquiredConversationIds,
      [],
    );
  },
);


test(
  "recoverable conversation absent from acquisition is not yet acquired",
  () => {
    const reconciliation =
      reconcileGenesisConversationExpectedHistory({
        expected:
          expectedInventory(),

        acquired:
          acquired([
            "conversation-001",
          ]),
      });

    assert.equal(
      reconciliation.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      reconciliation.notYetAcquiredConversationIds,
      [
        "conversation-002",
      ],
    );

    assert.equal(
      reconciliation.dayZeroConversationCoverageCertified,
      false,
    );
  },
);


test(
  "unexpected acquired conversations block completeness instead of silently expanding authority",
  () => {
    const reconciliation =
      reconcileGenesisConversationExpectedHistory({
        expected:
          expectedInventory(),

        acquired:
          acquired([
            "conversation-001",
            "conversation-002",
            "conversation-unexpected",
          ]),
      });

    assert.equal(
      reconciliation.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      reconciliation.unexpectedAcquiredConversationIds,
      [
        "conversation-unexpected",
      ],
    );

    assert.ok(
      reconciliation.blockers.includes(
        "acquired-conversations-not-in-authoritative-inventory",
      ),
    );
  },
);


test(
  "historically unavailable declaration is never treated as not-yet-acquired",
  () => {
    const reconciliation =
      reconcileGenesisConversationExpectedHistory({
        expected:
          expectedInventory(),

        acquired:
          acquired([
            "conversation-001",
            "conversation-002",
          ]),
      });

    assert.ok(
      reconciliation
        .historicallyUnavailableConversationIds
        .includes(
          "conversation-lost",
        ),
    );

    assert.ok(
      !reconciliation
        .notYetAcquiredConversationIds
        .includes(
          "conversation-lost",
        ),
    );
  },
);
