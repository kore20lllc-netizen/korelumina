import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationAcquisitionInventory,
} from "./GenesisConversationAcquisitionInventory.js";


export type GenesisConversationExpectedHistoryInventoryId =
  `genesis-conversation-expected-history:${string}`;


export type GenesisExpectedConversationDisposition =
  | "EXPECTED_RECOVERABLE"
  | "HISTORICALLY_UNAVAILABLE";


export interface GenesisExpectedConversationRecord {
  conversationId:
    string;

  disposition:
    GenesisExpectedConversationDisposition;

  projectId?:
    string;

  sourceLocator?:
    string;

  firstKnownAt?:
    number;

  lastKnownAt?:
    number;

  basis:
    string;
}


export interface GenesisConversationExpectedHistoryAuthority {
  authorityId:
    string;

  authorityClass:
    string;

  certifiedBy:
    string;

  certifiedAt:
    number;

  scope:
    string;

  version:
    string;
}


export interface GenesisConversationExpectedHistoryInventory {
  inventoryId:
    GenesisConversationExpectedHistoryInventoryId;

  authority:
    GenesisConversationExpectedHistoryAuthority;

  historicalStart:
    number | null;

  historicalEnd:
    number | null;

  conversations:
    readonly GenesisExpectedConversationRecord[];
}


export type GenesisConversationExpectedHistoryReconciliationState =
  | "COMPLETE"
  | "INCOMPLETE"
  | "BLOCKED";


export interface GenesisConversationExpectedHistoryReconciliation {
  expectedInventoryId:
    GenesisConversationExpectedHistoryInventoryId;

  acquisitionInventoryId:
    GenesisConversationAcquisitionInventory[
      "inventoryId"
    ];

  state:
    GenesisConversationExpectedHistoryReconciliationState;

  expectedRecoverableConversationIds:
    readonly string[];

  acquiredExpectedConversationIds:
    readonly string[];

  notYetAcquiredConversationIds:
    readonly string[];

  historicallyUnavailableConversationIds:
    readonly string[];

  unexpectedAcquiredConversationIds:
    readonly string[];

  blockers:
    readonly string[];

  dayZeroConversationCoverageCertified:
    boolean;
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

  error:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      error,
    );
  }
}


export function buildGenesisConversationExpectedHistoryInventory(
  input: {
    authority:
      GenesisConversationExpectedHistoryAuthority;

    historicalStart?:
      number;

    historicalEnd?:
      number;

    conversations:
      readonly GenesisExpectedConversationRecord[];
  },
): GenesisConversationExpectedHistoryInventory {
  const authority = {
    authorityId:
      requireNonEmpty(
        input.authority.authorityId,
        "genesis_conversation_expected_history_authority_id_required",
      ),

    authorityClass:
      requireNonEmpty(
        input.authority.authorityClass,
        "genesis_conversation_expected_history_authority_class_required",
      ),

    certifiedBy:
      requireNonEmpty(
        input.authority.certifiedBy,
        "genesis_conversation_expected_history_certifier_required",
      ),

    certifiedAt:
      input.authority.certifiedAt,

    scope:
      requireNonEmpty(
        input.authority.scope,
        "genesis_conversation_expected_history_scope_required",
      ),

    version:
      requireNonEmpty(
        input.authority.version,
        "genesis_conversation_expected_history_version_required",
      ),
  };

  validateTimestamp(
    authority.certifiedAt,
    "genesis_conversation_expected_history_certified_at_invalid",
  );

  if (
    input.historicalStart !==
    undefined
  ) {
    validateTimestamp(
      input.historicalStart,
      "genesis_conversation_expected_history_start_invalid",
    );
  }

  if (
    input.historicalEnd !==
    undefined
  ) {
    validateTimestamp(
      input.historicalEnd,
      "genesis_conversation_expected_history_end_invalid",
    );
  }

  if (
    input.historicalStart !==
      undefined &&
    input.historicalEnd !==
      undefined &&
    input.historicalStart >
      input.historicalEnd
  ) {
    throw new Error(
      "genesis_conversation_expected_history_range_invalid",
    );
  }

  const seen =
    new Set<string>();

  const conversations =
    input.conversations
      .map(
        record => {
          const conversationId =
            requireNonEmpty(
              record.conversationId,
              "genesis_conversation_expected_history_conversation_id_required",
            );

          if (
            seen.has(
              conversationId,
            )
          ) {
            throw new Error(
              "genesis_conversation_expected_history_duplicate_conversation",
            );
          }

          seen.add(
            conversationId,
          );

          const basis =
            requireNonEmpty(
              record.basis,
              "genesis_conversation_expected_history_basis_required",
            );

          if (
            record.firstKnownAt !==
            undefined
          ) {
            validateTimestamp(
              record.firstKnownAt,
              "genesis_conversation_expected_history_first_known_at_invalid",
            );
          }

          if (
            record.lastKnownAt !==
            undefined
          ) {
            validateTimestamp(
              record.lastKnownAt,
              "genesis_conversation_expected_history_last_known_at_invalid",
            );
          }

          if (
            record.firstKnownAt !==
              undefined &&
            record.lastKnownAt !==
              undefined &&
            record.firstKnownAt >
              record.lastKnownAt
          ) {
            throw new Error(
              "genesis_conversation_expected_history_record_range_invalid",
            );
          }

          return {
            ...record,

            conversationId,

            basis,
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.conversationId
            .localeCompare(
              right.conversationId,
            ),
      );

  const historicalStart =
    input.historicalStart ??
    null;

  const historicalEnd =
    input.historicalEnd ??
    null;

  const inventoryId =
    `genesis-conversation-expected-history:${hash({
      authority,

      historicalStart,

      historicalEnd,

      conversations,
    })}` as GenesisConversationExpectedHistoryInventoryId;

  return {
    inventoryId,

    authority,

    historicalStart,

    historicalEnd,

    conversations,
  };
}


export function reconcileGenesisConversationExpectedHistory(
  input: {
    expected:
      GenesisConversationExpectedHistoryInventory;

    acquired:
      GenesisConversationAcquisitionInventory;
  },
): GenesisConversationExpectedHistoryReconciliation {
  const expectedRecoverableConversationIds =
    input.expected
      .conversations
      .filter(
        record =>
          record.disposition ===
          "EXPECTED_RECOVERABLE",
      )
      .map(
        record =>
          record.conversationId,
      )
      .sort();

  const historicallyUnavailableConversationIds =
    input.expected
      .conversations
      .filter(
        record =>
          record.disposition ===
          "HISTORICALLY_UNAVAILABLE",
      )
      .map(
        record =>
          record.conversationId,
      )
      .sort();

  const expectedRecoverable =
    new Set(
      expectedRecoverableConversationIds,
    );

  const declaredUnavailable =
    new Set(
      historicallyUnavailableConversationIds,
    );

  const acquired =
    new Set(
      input.acquired
        .acquiredConversationIds,
    );

  const acquiredExpectedConversationIds =
    expectedRecoverableConversationIds
      .filter(
        conversationId =>
          acquired.has(
            conversationId,
          ),
      );

  const notYetAcquiredConversationIds =
    expectedRecoverableConversationIds
      .filter(
        conversationId =>
          !acquired.has(
            conversationId,
          ),
      );

  const unexpectedAcquiredConversationIds =
    [
      ...acquired,
    ]
      .filter(
        conversationId =>
          !expectedRecoverable.has(
            conversationId,
          ) &&
          !declaredUnavailable.has(
            conversationId,
          ),
      )
      .sort();

  const blockers:
    string[] =
      [];

  if (
    input.acquired.historyState !==
    "ACQUIRED"
  ) {
    blockers.push(
      "conversation-history-not-acquired",
    );
  }

  if (
    notYetAcquiredConversationIds.length >
    0
  ) {
    blockers.push(
      "expected-conversations-not-yet-acquired",
    );
  }

  if (
    unexpectedAcquiredConversationIds.length >
    0
  ) {
    blockers.push(
      "acquired-conversations-not-in-authoritative-inventory",
    );
  }

  if (
    input.acquired.gapCounts
      .permissionBlocked >
      0 ||
    input.acquired.gapCounts
      .sourceUnavailable >
      0
  ) {
    blockers.push(
      "conversation-acquisition-source-gaps-unresolved",
    );
  }

  const hardBlocked =
    input.acquired.historyState ===
      "UNCONFIGURED" ||
    input.acquired.historyState ===
      "SOURCE_UNAVAILABLE" ||
    input.acquired.historyState ===
      "ACQUISITION_FAILED";

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    GenesisConversationExpectedHistoryReconciliationState =
      hardBlocked
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "INCOMPLETE"
          : "COMPLETE";

  return {
    expectedInventoryId:
      input.expected.inventoryId,

    acquisitionInventoryId:
      input.acquired.inventoryId,

    state,

    expectedRecoverableConversationIds,

    acquiredExpectedConversationIds,

    notYetAcquiredConversationIds,

    historicallyUnavailableConversationIds,

    unexpectedAcquiredConversationIds,

    blockers:
      normalizedBlockers,

    dayZeroConversationCoverageCertified:
      state ===
      "COMPLETE",
  };
}
