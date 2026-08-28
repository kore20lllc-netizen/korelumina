import {
  createHash,
} from "node:crypto";

import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";


export const EDUCATIONAL_AUTHORITY_RESOLUTION_VERSION =
  "educational-authority-resolution:v1" as const;


export type EducationalAuthorityResolutionId =
  `educational-authority-resolution:${string}`;


export interface EducationalAuthorityResolution {
  resolutionId:
    EducationalAuthorityResolutionId;

  version:
    typeof EDUCATIONAL_AUTHORITY_RESOLUTION_VERSION;

  artifactId:
    string;

  learningRole:
    EducationalCorpusLearningRole;

  decision:
    "APPROVED";

  reviewerId:
    string;

  reviewedAt:
    number;

  reason:
    string;

  authorityPolicyVersion:
    string;

  dayZeroCertificationId:
    string;

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface CreateEducationalAuthorityResolutionInput {
  artifactId:
    string;

  learningRole:
    EducationalCorpusLearningRole;

  reviewerId:
    string;

  reviewedAt?:
    number;

  reason:
    string;

  authorityPolicyVersion:
    string;

  dayZeroCertificationId:
    string;
}


function required(
  value:
    string,

  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
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
        value,
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


export function createEducationalAuthorityResolution(
  input:
    CreateEducationalAuthorityResolutionInput,
): EducationalAuthorityResolution {
  const artifactId =
    required(
      input.artifactId,
      "educational_authority_resolution_artifact_id_required",
    );

  const reviewerId =
    required(
      input.reviewerId,
      "educational_authority_resolution_reviewer_id_required",
    );

  const reason =
    required(
      input.reason,
      "educational_authority_resolution_reason_required",
    );

  const authorityPolicyVersion =
    required(
      input.authorityPolicyVersion,
      "educational_authority_resolution_policy_version_required",
    );

  const dayZeroCertificationId =
    required(
      input.dayZeroCertificationId,
      "educational_authority_resolution_day_zero_certification_required",
    );

  if (
    !dayZeroCertificationId.startsWith(
      "genesis-day-zero-certification:",
    )
  ) {
    throw new Error(
      "educational_authority_resolution_day_zero_certification_invalid",
    );
  }

  const reviewedAt =
    input.reviewedAt ??
    Date.now();

  if (
    !Number.isFinite(
      reviewedAt,
    ) ||
    reviewedAt <=
      0
  ) {
    throw new Error(
      "educational_authority_resolution_reviewed_at_invalid",
    );
  }

  const identity = {
    artifactId,

    learningRole:
      input.learningRole,

    reviewerId,

    reviewedAt,

    reason,

    authorityPolicyVersion,

    dayZeroCertificationId,
  };

  return {
    resolutionId:
      `educational-authority-resolution:${hash(
        identity,
      )}`,

    version:
      EDUCATIONAL_AUTHORITY_RESOLUTION_VERSION,

    artifactId,

    learningRole:
      input.learningRole,

    decision:
      "APPROVED",

    reviewerId,

    reviewedAt,

    reason,

    authorityPolicyVersion,

    dayZeroCertificationId,

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
