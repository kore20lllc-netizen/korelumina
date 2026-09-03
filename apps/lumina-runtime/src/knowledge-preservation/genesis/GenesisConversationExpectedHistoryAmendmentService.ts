import {
  amendGenesisConversationExpectedHistory,
} from "./GenesisConversationExpectedHistoryAmendment.js";

import type {
  GenesisConversationExpectedHistoryAmendment,
  GenesisConversationExpectedHistoryAmendmentDecision,
} from "./GenesisConversationExpectedHistoryAmendment.js";

import type {
  GenesisConversationExpectedHistoryInventoryId,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "./GenesisConversationHistoryReconciliationService.js";

import type {
  FileGenesisConversationExpectedHistoryAmendmentPersistenceStore,
} from "./GenesisConversationExpectedHistoryAmendmentPersistence.js";


export interface GenesisConversationExpectedHistoryAmendmentReconciliationService {
  read():
    GenesisConversationHistoryReconciliationProjection;

  saveExpectedHistory(
    inventory:
      NonNullable<
        GenesisConversationHistoryReconciliationProjection[
          "expectedHistory"
        ]
      >,
  ):
    GenesisConversationHistoryReconciliationProjection;
}


export interface GenesisConversationExpectedHistoryAmendmentRequest {
  expectedPreviousInventoryId:
    GenesisConversationExpectedHistoryInventoryId;

  decision:
    GenesisConversationExpectedHistoryAmendmentDecision;
}


export interface GenesisConversationExpectedHistoryAmendmentServiceProjection {
  amendment:
    GenesisConversationExpectedHistoryAmendment;

  reconciliation:
    GenesisConversationHistoryReconciliationProjection;
}


export class GenesisConversationExpectedHistoryAmendmentService {
  constructor(
    private readonly reconciliationService:
      GenesisConversationExpectedHistoryAmendmentReconciliationService,

    private readonly persistence:
      FileGenesisConversationExpectedHistoryAmendmentPersistenceStore,
  ) {}


  amend(
    request:
      GenesisConversationExpectedHistoryAmendmentRequest,
  ):
    GenesisConversationExpectedHistoryAmendmentServiceProjection {
    const currentProjection =
      this.reconciliationService
        .read();

    const currentExpectedHistory =
      currentProjection
        .expectedHistory;

    if (
      !currentExpectedHistory
    ) {
      throw new Error(
        "genesis_conversation_expected_history_amendment_expected_history_unavailable",
      );
    }

    /*
     * Recovery/idempotency path:
     *
     * If lineage has already been persisted and the authoritative
     * inventory replacement also completed, return the current
     * reconciliation instead of attempting to amend the already
     * governed conversation again.
     */
    const persisted =
      this.persistence
        .loadCurrent();

    if (
      persisted &&
      persisted.amendment.previousInventoryId ===
        request.expectedPreviousInventoryId &&
      persisted.amendment.conversationId ===
        request.decision.conversationId &&
      persisted.amendment.amendedBy ===
        request.decision.amendedBy &&
      persisted.amendment.amendedAt ===
        request.decision.amendedAt &&
      persisted.amendment.reason ===
        request.decision.reason
    ) {
      if (
        currentExpectedHistory.inventoryId ===
        persisted.amendment.amendedInventoryId
      ) {
        return {
          amendment:
            persisted.amendment,

          reconciliation:
            currentProjection,
        };
      }

      if (
        currentExpectedHistory.inventoryId !==
        persisted.amendment.previousInventoryId
      ) {
        throw new Error(
          "genesis_conversation_expected_history_amendment_stale_previous_inventory",
        );
      }

      const resumed =
        this.reconciliationService
          .saveExpectedHistory(
            persisted.amendment.inventory,
          );

      return {
        amendment:
          persisted.amendment,

        reconciliation:
          resumed,
      };
    }

    if (
      currentExpectedHistory.inventoryId !==
      request.expectedPreviousInventoryId
    ) {
      throw new Error(
        "genesis_conversation_expected_history_amendment_stale_previous_inventory",
      );
    }

    const currentReconciliation =
      currentProjection
        .reconciliation;

    if (
      !currentReconciliation
    ) {
      throw new Error(
        "genesis_conversation_expected_history_amendment_reconciliation_unavailable",
      );
    }

    if (
      !currentReconciliation
        .unexpectedAcquiredConversationIds
        .includes(
          request.decision.conversationId,
        )
    ) {
      throw new Error(
        "genesis_conversation_expected_history_amendment_conversation_not_currently_unexpected",
      );
    }

    const amendment =
      amendGenesisConversationExpectedHistory({
        current:
          currentExpectedHistory,

        acquired:
          currentProjection
            .acquisitionInventory,

        decision:
          request.decision,
      });

    /*
     * Persist immutable governance lineage first.
     *
     * If the process stops here, a retry can detect the same
     * lineage and resume the authority replacement safely.
     */
    this.persistence
      .save({
        previousInventory:
          currentExpectedHistory,

        amendment,
      });

    const reconciliation =
      this.reconciliationService
        .saveExpectedHistory(
          amendment.inventory,
        );

    return {
      amendment,

      reconciliation,
    };
  }
}
