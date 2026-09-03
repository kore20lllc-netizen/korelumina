import {
  createHash,
} from "node:crypto";

import type {
  GenesisDayZeroConversationCoverageEvidence,
} from "./GenesisDayZeroConversationCoverageEvidence.js";


export const GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION =
  "genesis-day-zero-conversation-coverage-certification:v1" as const;


export type GenesisDayZeroConversationCoverageCertificationId =
  `genesis-day-zero-conversation-coverage-certification:${string}`;


export interface GenesisDayZeroConversationCoverageCertificationDecision {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;
}


export interface GenesisDayZeroConversationCoverageCertification {
  certificationId:
    GenesisDayZeroConversationCoverageCertificationId;

  certificationVersion:
    typeof GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION;

  state:
    "CERTIFIED";

  evidenceId:
    GenesisDayZeroConversationCoverageEvidence[
      "evidenceId"
    ];

  expectedInventoryId:
    string;

  authorityId:
    string;

  authorityVersion:
    string;

  correlationProjectionId:
    string;

  expectedConversationCount:
    number;

  acquiredExpectedConversationCount:
    number;

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  dayZeroConversationCoverageCertified:
    true;
}


export type GenesisDayZeroConversationCoverageCertificationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisDayZeroConversationCoverageCertificationValidation {
  state:
    GenesisDayZeroConversationCoverageCertificationValidationState;

  certificationId:
    GenesisDayZeroConversationCoverageCertificationId;

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
    normalized.length ===
      0
  ) {
    throw new Error(
      `genesis_day_zero_conversation_coverage_certification_${field}_required`,
    );
  }

  return normalized;
}


function timestamp(
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
      "genesis_day_zero_conversation_coverage_certification_timestamp_invalid",
    );
  }

  return value;
}


function assertEvidenceCertifiable(
  evidence:
    GenesisDayZeroConversationCoverageEvidence,
): void {
  if (
    evidence.state !==
      "READY_FOR_REVIEW"
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_evidence_not_ready",
    );
  }

  if (
    !evidence
      .governedExpectedHistoryPresent
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_expected_history_not_governed",
    );
  }

  if (
    !evidence
      .reconciliationComplete
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_reconciliation_incomplete",
    );
  }

  if (
    !evidence
      .correlationComplete
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_correlation_incomplete",
    );
  }

  if (
    evidence.notYetAcquiredConversationIds
      .length >
      0
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_missing_expected_conversations",
    );
  }

  if (
    evidence.blockers.length >
      0
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_evidence_has_blockers",
    );
  }

  if (
    evidence
      .dayZeroConversationCoverageCertified
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_already_certified",
    );
  }
}


export function certifyGenesisDayZeroConversationCoverage(
  input: {
    evidence:
      GenesisDayZeroConversationCoverageEvidence;

    decision:
      GenesisDayZeroConversationCoverageCertificationDecision;
  },
): GenesisDayZeroConversationCoverageCertification {
  assertEvidenceCertifiable(
    input.evidence,
  );

  const certifiedBy =
    required(
      input.decision.certifiedBy,
      "certified_by",
    );

  const certifiedAt =
    timestamp(
      input.decision.certifiedAt,
    );

  const reason =
    required(
      input.decision.reason,
      "reason",
    );

  const identity = {
    certificationVersion:
      GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION,

    evidenceId:
      input.evidence.evidenceId,

    expectedInventoryId:
      input.evidence.expectedInventoryId,

    authorityId:
      input.evidence.authorityId,

    authorityVersion:
      input.evidence.authorityVersion,

    correlationProjectionId:
      input.evidence
        .correlationProjectionId,

    expectedConversationCount:
      input.evidence
        .expectedRecoverableConversationIds
        .length,

    acquiredExpectedConversationCount:
      input.evidence
        .acquiredExpectedConversationIds
        .length,

    certifiedBy,

    certifiedAt,

    reason,
  };

  return {
    certificationId:
      `genesis-day-zero-conversation-coverage-certification:${hash(
        identity,
      )}` as GenesisDayZeroConversationCoverageCertificationId,

    certificationVersion:
      GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION,

    state:
      "CERTIFIED",

    evidenceId:
      input.evidence.evidenceId,

    expectedInventoryId:
      input.evidence.expectedInventoryId,

    authorityId:
      input.evidence.authorityId,

    authorityVersion:
      input.evidence.authorityVersion,

    correlationProjectionId:
      input.evidence
        .correlationProjectionId,

    expectedConversationCount:
      input.evidence
        .expectedRecoverableConversationIds
        .length,

    acquiredExpectedConversationCount:
      input.evidence
        .acquiredExpectedConversationIds
        .length,

    certifiedBy,

    certifiedAt,

    reason,

    dayZeroConversationCoverageCertified:
      true,
  };
}


export function validateGenesisDayZeroConversationCoverageCertification(
  input: {
    certification:
      GenesisDayZeroConversationCoverageCertification;

    currentEvidence:
      GenesisDayZeroConversationCoverageEvidence;
  },
): GenesisDayZeroConversationCoverageCertificationValidation {
  const {
    certification,
    currentEvidence,
  } = input;

  const blockers:
    string[] =
      [];

  if (
    currentEvidence.state !==
      "READY_FOR_REVIEW"
  ) {
    blockers.push(
      "current-day-zero-conversation-coverage-evidence-not-ready",
    );
  }

  if (
    certification.evidenceId !==
      currentEvidence.evidenceId
  ) {
    blockers.push(
      "day-zero-conversation-coverage-evidence-changed",
    );
  }

  if (
    certification.expectedInventoryId !==
      currentEvidence.expectedInventoryId
  ) {
    blockers.push(
      "day-zero-conversation-expected-history-changed",
    );
  }

  if (
    certification.authorityId !==
      currentEvidence.authorityId ||
    certification.authorityVersion !==
      currentEvidence.authorityVersion
  ) {
    blockers.push(
      "day-zero-conversation-coverage-authority-changed",
    );
  }

  if (
    certification.correlationProjectionId !==
      currentEvidence
        .correlationProjectionId
  ) {
    blockers.push(
      "day-zero-conversation-correlation-changed",
    );
  }

  if (
    certification.expectedConversationCount !==
      currentEvidence
        .expectedRecoverableConversationIds
        .length ||
    certification.acquiredExpectedConversationCount !==
      currentEvidence
        .acquiredExpectedConversationIds
        .length
  ) {
    blockers.push(
      "day-zero-conversation-coverage-counts-changed",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  return {
    state:
      currentEvidence.state !==
        "READY_FOR_REVIEW"
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "STALE"
          : "VALID",

    certificationId:
      certification.certificationId,

    blockers:
      normalizedBlockers,
  };
}
