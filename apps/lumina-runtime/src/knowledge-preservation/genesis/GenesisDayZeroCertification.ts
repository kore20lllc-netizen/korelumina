import {
  createHash,
} from "node:crypto";

import type {
  GenesisDayZeroCertificationCandidate,
} from "./GenesisDayZeroCertificationCandidate.js";


export const GENESIS_DAY_ZERO_CERTIFICATION_VERSION =
  "genesis-day-zero-certification:v1" as const;


export type GenesisDayZeroCertificationId =
  `genesis-day-zero-certification:${string}`;


export interface GenesisDayZeroCertificationDecision {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  acknowledgedHistoricallyUnavailableConversationIds:
    readonly string[];
}


export interface GenesisDayZeroCertification {
  certificationId:
    GenesisDayZeroCertificationId;

  certificationVersion:
    typeof GENESIS_DAY_ZERO_CERTIFICATION_VERSION;

  state:
    "CERTIFIED";

  candidateId:
    GenesisDayZeroCertificationCandidate[
      "candidateId"
    ];

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  provenance: {
    repositorySeedCertificationId:
      string;

    corpusProjectionId:
      string;

    conversationExpectedInventoryId:
      string;

    conversationAcquisitionInventoryId:
      string;

    conversationCorrelationProjectionId:
      string;
  };

  certifiedHistoricalGaps: {
    historicallyUnavailableConversationIds:
      readonly string[];
  };

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export type GenesisDayZeroCertificationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisDayZeroCertificationValidation {
  state:
    GenesisDayZeroCertificationValidationState;

  certificationId:
    GenesisDayZeroCertificationId;

  currentCandidateId:
    GenesisDayZeroCertificationCandidate[
      "candidateId"
    ];

  blockers:
    readonly string[];
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


function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      `genesis_day_zero_certification_${field}_required`,
    );
  }

  return normalized;
}


function validateTimestamp(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new Error(
      "genesis_day_zero_certification_timestamp_invalid",
    );
  }

  return value;
}


function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}


function assertExactHistoricalGapAcknowledgement(
  candidate:
    GenesisDayZeroCertificationCandidate,

  decision:
    GenesisDayZeroCertificationDecision,
): readonly string[] {
  const expected =
    sortedUnique(
      candidate
        .visibleHistoricalGaps
        .historicallyUnavailableConversationIds,
    );

  const acknowledged =
    sortedUnique(
      decision
        .acknowledgedHistoricallyUnavailableConversationIds,
    );

  if (
    acknowledged.length !==
      decision
        .acknowledgedHistoricallyUnavailableConversationIds
        .length
  ) {
    throw new Error(
      "genesis_day_zero_certification_duplicate_gap_acknowledgement",
    );
  }

  if (
    expected.length !==
      acknowledged.length ||
    expected.some(
      (
        conversationId,
        index,
      ) =>
        conversationId !==
        acknowledged[
          index
        ],
    )
  ) {
    throw new Error(
      "genesis_day_zero_certification_historical_gap_acknowledgement_mismatch",
    );
  }

  return acknowledged;
}


function assertCandidateCertifiable(
  candidate:
    GenesisDayZeroCertificationCandidate,
): void {
  if (
    candidate.state !==
    "READY"
  ) {
    throw new Error(
      "genesis_day_zero_certification_candidate_not_ready",
    );
  }

  if (
    candidate.blockers.length >
    0
  ) {
    throw new Error(
      "genesis_day_zero_certification_candidate_has_blockers",
    );
  }

  if (
    candidate
      .repositoryNative
      .state !==
    "CERTIFIED"
  ) {
    throw new Error(
      "genesis_day_zero_certification_repository_native_not_certified",
    );
  }

  if (
    !candidate
      .repositoryNative
      .replayExact
  ) {
    throw new Error(
      "genesis_day_zero_certification_repository_replay_not_exact",
    );
  }

  if (
    candidate
      .conversationHistory
      .reconciliationState !==
    "COMPLETE"
  ) {
    throw new Error(
      "genesis_day_zero_certification_conversation_history_incomplete",
    );
  }

  if (
    candidate
      .correlation
      .state !==
    "COMPLETE"
  ) {
    throw new Error(
      "genesis_day_zero_certification_conversation_correlation_incomplete",
    );
  }

  if (
    candidate
      .conversationHistory
      .expectedInventoryId ===
    null
  ) {
    throw new Error(
      "genesis_day_zero_certification_expected_history_inventory_missing",
    );
  }

  if (
    candidate
      .visibleHistoricalGaps
      .notYetAcquiredConversationIds
      .length >
      0 ||
    candidate
      .visibleHistoricalGaps
      .unexpectedAcquiredConversationIds
      .length >
      0 ||
    candidate
      .visibleHistoricalGaps
      .unresolvedExplicitHistoricalLinks
      .length >
      0 ||
    candidate
      .visibleHistoricalGaps
      .episodeLineageGaps
      .length >
      0
  ) {
    throw new Error(
      "genesis_day_zero_certification_unresolved_historical_gaps",
    );
  }
}


export function certifyGenesisDayZero(
  input: {
    candidate:
      GenesisDayZeroCertificationCandidate;

    decision:
      GenesisDayZeroCertificationDecision;
  },
): GenesisDayZeroCertification {
  assertCandidateCertifiable(
    input.candidate,
  );

  const certifiedBy =
    required(
      input.decision
        .certifiedBy,
      "certified_by",
    );

  const certifiedAt =
    validateTimestamp(
      input.decision
        .certifiedAt,
    );

  const reason =
    required(
      input.decision
        .reason,
      "reason",
    );

  const acknowledgedHistoricalGaps =
    assertExactHistoricalGapAcknowledgement(
      input.candidate,
      input.decision,
    );

  const expectedInventoryId =
    input.candidate
      .conversationHistory
      .expectedInventoryId;

  if (
    expectedInventoryId ===
    null
  ) {
    throw new Error(
      "genesis_day_zero_certification_expected_history_inventory_missing",
    );
  }

  const provenance = {
    repositorySeedCertificationId:
      input.candidate
        .provenance
        .repositorySeedCertificationId,

    corpusProjectionId:
      input.candidate
        .provenance
        .corpusProjectionId,

    conversationExpectedInventoryId:
      expectedInventoryId,

    conversationAcquisitionInventoryId:
      input.candidate
        .provenance
        .conversationAcquisitionInventoryId,

    conversationCorrelationProjectionId:
      input.candidate
        .provenance
        .conversationCorrelationProjectionId,
  };

  const certificationId =
    `genesis-day-zero-certification:${hash({
      certificationVersion:
        GENESIS_DAY_ZERO_CERTIFICATION_VERSION,

      candidateId:
        input.candidate
          .candidateId,

      certifiedBy,

      certifiedAt,

      reason,

      provenance,

      certifiedHistoricalGaps: {
        historicallyUnavailableConversationIds:
          acknowledgedHistoricalGaps,
      },
    })}` as GenesisDayZeroCertificationId;

  return {
    certificationId,

    certificationVersion:
      GENESIS_DAY_ZERO_CERTIFICATION_VERSION,

    state:
      "CERTIFIED",

    candidateId:
      input.candidate
        .candidateId,

    certifiedBy,

    certifiedAt,

    reason,

    provenance,

    certifiedHistoricalGaps: {
      historicallyUnavailableConversationIds:
        acknowledgedHistoricalGaps,
    },

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


export function validateGenesisDayZeroCertification(
  input: {
    certification:
      GenesisDayZeroCertification;

    currentCandidate:
      GenesisDayZeroCertificationCandidate;
  },
): GenesisDayZeroCertificationValidation {
  const blockers:
    string[] =
      [];

  if (
    input.currentCandidate
      .state !==
    "READY"
  ) {
    blockers.push(
      "current-day-zero-candidate-not-ready",
    );
  }

  if (
    input.currentCandidate
      .candidateId !==
    input.certification
      .candidateId
  ) {
    blockers.push(
      "day-zero-certification-candidate-changed",
    );
  }

  if (
    input.currentCandidate
      .provenance
      .repositorySeedCertificationId !==
    input.certification
      .provenance
      .repositorySeedCertificationId
  ) {
    blockers.push(
      "repository-seed-certification-changed",
    );
  }

  if (
    input.currentCandidate
      .provenance
      .corpusProjectionId !==
    input.certification
      .provenance
      .corpusProjectionId
  ) {
    blockers.push(
      "genesis-corpus-projection-changed",
    );
  }

  if (
    input.currentCandidate
      .provenance
      .conversationExpectedInventoryId !==
    input.certification
      .provenance
      .conversationExpectedInventoryId
  ) {
    blockers.push(
      "conversation-expected-history-inventory-changed",
    );
  }

  if (
    input.currentCandidate
      .provenance
      .conversationAcquisitionInventoryId !==
    input.certification
      .provenance
      .conversationAcquisitionInventoryId
  ) {
    blockers.push(
      "conversation-acquisition-inventory-changed",
    );
  }

  if (
    input.currentCandidate
      .provenance
      .conversationCorrelationProjectionId !==
    input.certification
      .provenance
      .conversationCorrelationProjectionId
  ) {
    blockers.push(
      "conversation-correlation-projection-changed",
    );
  }

  const currentHistoricalGaps =
    sortedUnique(
      input.currentCandidate
        .visibleHistoricalGaps
        .historicallyUnavailableConversationIds,
    );

  if (
    currentHistoricalGaps.length !==
      input.certification
        .certifiedHistoricalGaps
        .historicallyUnavailableConversationIds
        .length ||
    currentHistoricalGaps.some(
      (
        conversationId,
        index,
      ) =>
        conversationId !==
        input.certification
          .certifiedHistoricalGaps
          .historicallyUnavailableConversationIds[
            index
          ],
    )
  ) {
    blockers.push(
      "certified-historical-gap-set-changed",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    GenesisDayZeroCertificationValidationState =
      input.currentCandidate
        .state !==
        "READY"
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "STALE"
          : "VALID";

  return {
    state,

    certificationId:
      input.certification
        .certificationId,

    currentCandidateId:
      input.currentCandidate
        .candidateId,

    blockers:
      normalizedBlockers,
  };
}
