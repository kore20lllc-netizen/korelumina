import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationAuthoritativeCompletenessEvidence,
} from "./GenesisConversationAuthoritativeCompletenessEvidence.js";


export const GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION =
  "genesis-conversation-authoritative-completeness-certification:v1" as const;


export type GenesisConversationAuthoritativeCompletenessCertificationId =
  `genesis-conversation-authoritative-completeness-certification:${string}`;


export interface GenesisConversationAuthoritativeCompletenessCertificationDecision {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;
}


export interface GenesisConversationAuthoritativeCompletenessCertification {
  certificationId:
    GenesisConversationAuthoritativeCompletenessCertificationId;

  certificationVersion:
    typeof GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION;

  state:
    "CERTIFIED";

  candidateId:
    string;

  reviewId:
    string;

  acquisitionId:
    string;

  acquisitionInventoryId:
    string;

  candidateConversationCount:
    number;

  acquiredConversationCount:
    number;

  projectCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  knownOmissionCount:
    number;

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  authoritativeExpectedHistoryCreated:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


export type GenesisConversationAuthoritativeCompletenessCertificationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisConversationAuthoritativeCompletenessCertificationValidation {
  state:
    GenesisConversationAuthoritativeCompletenessCertificationValidationState;

  certificationId:
    GenesisConversationAuthoritativeCompletenessCertificationId;

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
      `genesis_conversation_authoritative_completeness_certification_${field}_required`,
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
      "genesis_conversation_authoritative_completeness_certification_timestamp_invalid",
    );
  }

  return value;
}


function assertEvidenceCertifiable(
  evidence:
    GenesisConversationAuthoritativeCompletenessEvidence,
): void {
  if (
    evidence.state !==
      "READY_FOR_REVIEW"
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_evidence_not_ready",
    );
  }

  if (
    evidence.candidateId ===
      null ||
    evidence.reviewId ===
      null ||
    evidence.acquisitionId ===
      null
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_evidence_provenance_incomplete",
    );
  }

  if (
    evidence.knownOmissionCount !==
      0
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_known_omissions_present",
    );
  }

  if (
    evidence.gapCounts.notYetAcquired !==
      0 ||
    evidence.gapCounts.historicallyUnavailable !==
      0 ||
    evidence.gapCounts.permissionBlocked !==
      0 ||
    evidence.gapCounts.sourceUnavailable !==
      0
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_acquisition_gaps_present",
    );
  }

  if (
    evidence.candidateConversationCount !==
      evidence.acquiredConversationCount
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_count_mismatch",
    );
  }

  if (
    evidence.blockers.length !==
      1 ||
    evidence.blockers[0] !==
      "authoritative-completeness-evidence-not-certified"
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_evidence_has_blockers",
    );
  }

  if (
    evidence.authoritativeExpectedHistoryCreated
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_expected_history_already_created",
    );
  }

  if (
    evidence.dayZeroConversationCoverageCertified
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_day_zero_already_certified",
    );
  }

  if (
    evidence.promotionAvailable
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_promotion_boundary_invalid",
    );
  }
}


export function certifyGenesisConversationAuthoritativeCompleteness(
  input: {
    evidence:
      GenesisConversationAuthoritativeCompletenessEvidence;

    decision:
      GenesisConversationAuthoritativeCompletenessCertificationDecision;
  },
): GenesisConversationAuthoritativeCompletenessCertification {
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

  const candidateId =
    input.evidence.candidateId!;

  const reviewId =
    input.evidence.reviewId!;

  const acquisitionId =
    input.evidence.acquisitionId!;

  const identity = {
    certificationVersion:
      GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION,

    candidateId,

    reviewId,

    acquisitionId,

    acquisitionInventoryId:
      input.evidence.acquisitionInventoryId,

    candidateConversationCount:
      input.evidence.candidateConversationCount,

    acquiredConversationCount:
      input.evidence.acquiredConversationCount,

    projectCount:
      input.evidence.projectCount,

    historicalSourceCount:
      input.evidence.historicalSourceCount,

    evidenceCount:
      input.evidence.evidenceCount,

    knownOmissionCount:
      input.evidence.knownOmissionCount,

    certifiedBy,

    certifiedAt,

    reason,
  };

  return {
    certificationId:
      `genesis-conversation-authoritative-completeness-certification:${hash(
        identity,
      )}` as GenesisConversationAuthoritativeCompletenessCertificationId,

    certificationVersion:
      GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION,

    state:
      "CERTIFIED",

    candidateId,

    reviewId,

    acquisitionId,

    acquisitionInventoryId:
      input.evidence.acquisitionInventoryId,

    candidateConversationCount:
      input.evidence.candidateConversationCount,

    acquiredConversationCount:
      input.evidence.acquiredConversationCount,

    projectCount:
      input.evidence.projectCount,

    historicalSourceCount:
      input.evidence.historicalSourceCount,

    evidenceCount:
      input.evidence.evidenceCount,

    knownOmissionCount:
      input.evidence.knownOmissionCount,

    certifiedBy,

    certifiedAt,

    reason,

    authoritativeExpectedHistoryCreated:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}


export function validateGenesisConversationAuthoritativeCompletenessCertification(
  input: {
    certification:
      GenesisConversationAuthoritativeCompletenessCertification;

    currentEvidence:
      GenesisConversationAuthoritativeCompletenessEvidence;
  },
): GenesisConversationAuthoritativeCompletenessCertificationValidation {
  const blockers:
    string[] =
      [];

  const {
    certification,
    currentEvidence,
  } = input;

  if (
    currentEvidence.state !==
      "READY_FOR_REVIEW"
  ) {
    blockers.push(
      "current-authoritative-completeness-evidence-not-ready",
    );
  }

  if (
    currentEvidence.candidateId !==
      certification.candidateId
  ) {
    blockers.push(
      "conversation-completeness-candidate-changed",
    );
  }

  if (
    currentEvidence.reviewId !==
      certification.reviewId
  ) {
    blockers.push(
      "conversation-completeness-review-changed",
    );
  }

  if (
    currentEvidence.acquisitionId !==
      certification.acquisitionId
  ) {
    blockers.push(
      "conversation-completeness-acquisition-changed",
    );
  }

  if (
    currentEvidence.acquisitionInventoryId !==
      certification.acquisitionInventoryId
  ) {
    blockers.push(
      "conversation-completeness-acquisition-inventory-changed",
    );
  }

  if (
    currentEvidence.candidateConversationCount !==
      certification.candidateConversationCount ||
    currentEvidence.acquiredConversationCount !==
      certification.acquiredConversationCount
  ) {
    blockers.push(
      "conversation-completeness-counts-changed",
    );
  }

  if (
    currentEvidence.projectCount !==
      certification.projectCount
  ) {
    blockers.push(
      "conversation-completeness-project-count-changed",
    );
  }

  if (
    currentEvidence.historicalSourceCount !==
      certification.historicalSourceCount ||
    currentEvidence.evidenceCount !==
      certification.evidenceCount
  ) {
    blockers.push(
      "conversation-completeness-evidence-counts-changed",
    );
  }

  if (
    currentEvidence.knownOmissionCount !==
      certification.knownOmissionCount
  ) {
    blockers.push(
      "conversation-completeness-known-omissions-changed",
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
