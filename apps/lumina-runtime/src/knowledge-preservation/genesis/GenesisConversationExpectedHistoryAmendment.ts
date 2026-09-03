import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationAcquisitionInventory,
} from "./GenesisConversationAcquisitionInventory.js";

import {
  buildGenesisConversationExpectedHistoryInventory,
  reconcileGenesisConversationExpectedHistory,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationExpectedHistoryInventory,
  GenesisConversationExpectedHistoryInventoryId,
} from "./GenesisConversationExpectedHistoryInventory.js";


export type GenesisConversationExpectedHistoryAmendmentId =
  `genesis-conversation-expected-history-amendment:${string}`;


export interface GenesisConversationExpectedHistoryAmendmentDecision {
  conversationId:
    string;

  amendedBy:
    string;

  amendedAt:
    number;

  reason:
    string;
}


export interface GenesisConversationExpectedHistoryAmendment {
  amendmentId:
    GenesisConversationExpectedHistoryAmendmentId;

  previousInventoryId:
    GenesisConversationExpectedHistoryInventoryId;

  amendedInventoryId:
    GenesisConversationExpectedHistoryInventoryId;

  conversationId:
    string;

  amendedBy:
    string;

  amendedAt:
    number;

  reason:
    string;

  inventory:
    GenesisConversationExpectedHistoryInventory;
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function requireNonEmpty(
  value:
    string,

  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
}


function validateTimestamp(
  value:
    number,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_timestamp_invalid",
    );
  }
}


export function amendGenesisConversationExpectedHistory(
  input: {
    current:
      GenesisConversationExpectedHistoryInventory;

    acquired:
      GenesisConversationAcquisitionInventory;

    decision:
      GenesisConversationExpectedHistoryAmendmentDecision;
  },
): GenesisConversationExpectedHistoryAmendment {
  const conversationId =
    requireNonEmpty(
      input.decision.conversationId,
      "genesis_conversation_expected_history_amendment_conversation_id_required",
    );

  const amendedBy =
    requireNonEmpty(
      input.decision.amendedBy,
      "genesis_conversation_expected_history_amendment_actor_required",
    );

  const reason =
    requireNonEmpty(
      input.decision.reason,
      "genesis_conversation_expected_history_amendment_reason_required",
    );

  validateTimestamp(
    input.decision.amendedAt,
  );

  const reconciliation =
    reconcileGenesisConversationExpectedHistory({
      expected:
        input.current,

      acquired:
        input.acquired,
    });

  if (
    !input.acquired
      .acquiredConversationIds
      .includes(
        conversationId,
      )
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_conversation_not_acquired",
    );
  }

  if (
    !reconciliation
      .unexpectedAcquiredConversationIds
      .includes(
        conversationId,
      )
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_conversation_not_unexpected",
    );
  }

  const inventory =
    buildGenesisConversationExpectedHistoryInventory({
      authority: {
        ...input.current.authority,
      },

      historicalStart:
        input.current.historicalStart ??
        undefined,

      historicalEnd:
        input.current.historicalEnd ??
        undefined,

      conversations: [
        ...input.current.conversations,

        {
          conversationId,

          disposition:
            "EXPECTED_RECOVERABLE",

          basis:
            `Governed post-creation expected-history amendment: ${reason}`,
        },
      ],
    });

  if (
    inventory.inventoryId ===
    input.current.inventoryId
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_inventory_identity_unchanged",
    );
  }

  const amendmentId =
    `genesis-conversation-expected-history-amendment:${hash({
      previousInventoryId:
        input.current.inventoryId,

      amendedInventoryId:
        inventory.inventoryId,

      conversationId,

      amendedBy,

      amendedAt:
        input.decision.amendedAt,

      reason,
    })}` as GenesisConversationExpectedHistoryAmendmentId;

  return {
    amendmentId,

    previousInventoryId:
      input.current.inventoryId,

    amendedInventoryId:
      inventory.inventoryId,

    conversationId,

    amendedBy,

    amendedAt:
      input.decision.amendedAt,

    reason,

    inventory,
  };
}
