import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationCorrelationCompletenessProjection,
} from "./GenesisConversationCorrelationCompleteness.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "./GenesisConversationHistoryReconciliationService.js";


export const GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_EVIDENCE_VERSION =
  "genesis-day-zero-conversation-coverage-evidence:v1" as const;


export type GenesisDayZeroConversationCoverageEvidenceId =
  `genesis-day-zero-conversation-coverage-evidence:${string}`;


export interface GenesisDayZeroConversationCoverageEvidence {
  evidenceId:
    GenesisDayZeroConversationCoverageEvidenceId;

  evidenceVersion:
    typeof GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_EVIDENCE_VERSION;

  state:
    "READY_FOR_REVIEW" |
    "BLOCKED";

  expectedInventoryId:
    string;

  authorityId:
    string;

  authorityVersion:
    string;

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

  correlationProjectionId:
    string;

  reconciliationComplete:
    boolean;

  correlationComplete:
    boolean;

  governedExpectedHistoryPresent:
    boolean;

  blockers:
    readonly string[];

  dayZeroConversationCoverageCertified:
    false;
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


export function buildGenesisDayZeroConversationCoverageEvidence(
  input: {
    conversationHistory:
      GenesisConversationHistoryReconciliationProjection;

    conversationCorrelation:
      GenesisConversationCorrelationCompletenessProjection;
  },
): GenesisDayZeroConversationCoverageEvidence {
  const {
    conversationHistory,
    conversationCorrelation,
  } = input;

  const expectedHistory =
    conversationHistory
      .expectedHistory;

  const reconciliation =
    conversationHistory
      .reconciliation;

  const blockers:
    string[] =
      [];

  if (
    expectedHistory ===
      null
  ) {
    blockers.push(
      "authoritative-conversation-history-inventory-missing",
    );
  }

  if (
    reconciliation ===
      null
  ) {
    blockers.push(
      "conversation-history-reconciliation-missing",
    );
  } else if (
    reconciliation.state !==
      "COMPLETE"
  ) {
    blockers.push(
      "conversation-history-reconciliation-incomplete",
    );
  }

  if (
    conversationCorrelation.state !==
      "COMPLETE"
  ) {
    blockers.push(
      "conversation-historical-correlation-incomplete",
    );
  }

  const expectedInventoryId =
    expectedHistory
      ?.inventoryId ??
    "conversation-expected-history-unavailable";

  const authorityId =
    expectedHistory
      ?.authority
      .authorityId ??
    "conversation-expected-history-authority-unavailable";

  const authorityVersion =
    expectedHistory
      ?.authority
      .version ??
    "conversation-expected-history-authority-version-unavailable";

  const expectedRecoverableConversationIds =
    reconciliation
      ?.expectedRecoverableConversationIds ??
    [];

  const acquiredExpectedConversationIds =
    reconciliation
      ?.acquiredExpectedConversationIds ??
    [];

  const notYetAcquiredConversationIds =
    reconciliation
      ?.notYetAcquiredConversationIds ??
    [];

  const historicallyUnavailableConversationIds =
    reconciliation
      ?.historicallyUnavailableConversationIds ??
    [];

  const unexpectedAcquiredConversationIds =
    reconciliation
      ?.unexpectedAcquiredConversationIds ??
    [];

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const identity = {
    evidenceVersion:
      GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_EVIDENCE_VERSION,

    expectedInventoryId,

    authorityId,

    authorityVersion,

    expectedRecoverableConversationIds,

    acquiredExpectedConversationIds,

    notYetAcquiredConversationIds,

    historicallyUnavailableConversationIds,

    unexpectedAcquiredConversationIds,

    correlationProjectionId:
      conversationCorrelation
        .projectionId,

    reconciliationComplete:
      reconciliation?.state ===
      "COMPLETE",

    correlationComplete:
      conversationCorrelation.state ===
      "COMPLETE",

    blockers:
      normalizedBlockers,
  };

  return {
    evidenceId:
      `genesis-day-zero-conversation-coverage-evidence:${hash(
        identity,
      )}` as GenesisDayZeroConversationCoverageEvidenceId,

    evidenceVersion:
      GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_EVIDENCE_VERSION,

    state:
      normalizedBlockers.length ===
        0
        ? "READY_FOR_REVIEW"
        : "BLOCKED",

    expectedInventoryId,

    authorityId,

    authorityVersion,

    expectedRecoverableConversationIds,

    acquiredExpectedConversationIds,

    notYetAcquiredConversationIds,

    historicallyUnavailableConversationIds,

    unexpectedAcquiredConversationIds,

    correlationProjectionId:
      conversationCorrelation
        .projectionId,

    reconciliationComplete:
      reconciliation?.state ===
      "COMPLETE",

    correlationComplete:
      conversationCorrelation.state ===
      "COMPLETE",

    governedExpectedHistoryPresent:
      expectedHistory !==
      null,

    blockers:
      normalizedBlockers,

    dayZeroConversationCoverageCertified:
      false,
  };
}
