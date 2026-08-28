import {
  createHash,
} from "node:crypto";

import {
  assessEducationalCorpusAuthority,
  EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  EducationalCorpusAuthorityAssessment,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  EducationalArtifactProjection,
} from "./projection/index.js";

import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "../knowledge-preservation/genesis/index.js";

import type {
  GenesisHistoricalEducationSourceAssessment,
} from "./GenesisHistoricalEducationSourceAssessment.js";

import type {
  EducationalAuthorityResolution,
} from "./EducationalAuthorityResolution.js";


export type EducationalCorpusSourceContractId =
  `educational-corpus-source-contract:${string}`;


export interface EducationalCorpusSourceContract {
  contractId:
    EducationalCorpusSourceContractId;

  dayZeroCertificationId:
    string;

  dayZeroCandidateId:
    string;

  /*
   * Governing/current educational sources.
   *
   * These retain the existing authority policy and must not be
   * weakened by historical evidence.
   */
  assessments:
    readonly EducationalCorpusAuthorityAssessment[];

  /*
   * Genesis historical educational evidence.
   *
   * These records are educationally admissible because of governed
   * Genesis provenance. They do not create current governing
   * authority.
   */
  historicalAssessments:
    readonly GenesisHistoricalEducationSourceAssessment[];

  summary: {
    artifacts:
      number;

    eligible:
      number;

    requiresAuthorityReview:
      number;

    excluded:
      number;

    blocked:
      number;

    historicalArtifacts:
      number;

    historicalEligible:
      number;

    historicalBlocked:
      number;
  };

  unresolvedArtifactIds:
    readonly string[];

  blockedHistoricalRecordIds:
    readonly string[];

  /*
   * Contract reconciliation only.
   * This does not constitute an Educational Corpus certification
   * or Initial Competency evidence.
   */
  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
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


export function buildEducationalCorpusSourceContract(
  input: {
    artifacts:
      readonly EducationalArtifactProjection[];

    historicalAssessments?:
      readonly GenesisHistoricalEducationSourceAssessment[];

    authorityResolutions?:
      readonly EducationalAuthorityResolution[];

    dayZero:
      GenesisDayZeroCertificationRuntimeProjection;
  },
): EducationalCorpusSourceContract {
  if (
    input.dayZero.state !==
      "VALID" ||
    !input.dayZero.certification
  ) {
    throw new Error(
      "educational_corpus_valid_day_zero_certification_required",
    );
  }

  const dayZeroCertificationId =
    input.dayZero
      .certification
      .certificationId;

  const historicalAssessments =
    [
      ...(
        input.historicalAssessments ??
        []
      ),
    ].sort(
      (
        left,
        right,
      ) =>
        left.recordId.localeCompare(
          right.recordId,
        ),
    );

  const resolutionsByArtifact =
    new Map(
      (
        input.authorityResolutions ??
        []
      )
        .filter(
          resolution =>
            resolution.authorityPolicyVersion ===
              EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION &&
            resolution.dayZeroCertificationId ===
              dayZeroCertificationId,
        )
        .map(
          resolution => [
            resolution.artifactId,
            resolution,
          ] as const,
        ),
    );

  const assessments =
    input.artifacts
      .map(
        artifact => {
          const assessment =
            assessEducationalCorpusAuthority({
              artifact,

              dayZero:
                input.dayZero,
            });

          if (
            assessment.decision !==
              "REQUIRES_AUTHORITY_REVIEW"
          ) {
            return assessment;
          }

          const resolution =
            resolutionsByArtifact.get(
              artifact.id,
            );

          if (
            !resolution
          ) {
            return assessment;
          }

          return {
            ...assessment,

            decision:
              "ELIGIBLE" as const,

            learningRole:
              resolution.learningRole,

            reasons: [
              ...assessment.reasons,
              "educational-authority-resolution-applied",
              `educational-authority-resolution:${resolution.resolutionId}`,
            ],
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.artifactId.localeCompare(
            right.artifactId,
          ),
      );

  const summary = {
    artifacts:
      assessments.length,

    eligible:
      assessments.filter(
        assessment =>
          assessment.decision ===
          "ELIGIBLE",
      ).length,

    requiresAuthorityReview:
      assessments.filter(
        assessment =>
          assessment.decision ===
          "REQUIRES_AUTHORITY_REVIEW",
      ).length,

    excluded:
      assessments.filter(
        assessment =>
          assessment.decision ===
          "EXCLUDED",
      ).length,

    blocked:
      assessments.filter(
        assessment =>
          assessment.decision ===
          "BLOCKED",
      ).length,

    historicalArtifacts:
      historicalAssessments.length,

    historicalEligible:
      historicalAssessments.filter(
        assessment =>
          assessment.decision ===
          "ELIGIBLE_HISTORICAL_EVIDENCE",
      ).length,

    historicalBlocked:
      historicalAssessments.filter(
        assessment =>
          assessment.decision ===
          "BLOCKED",
      ).length,
  };

  const unresolvedArtifactIds =
    assessments
      .filter(
        assessment =>
          assessment.decision ===
            "REQUIRES_AUTHORITY_REVIEW" ||
          assessment.decision ===
            "BLOCKED",
      )
      .map(
        assessment =>
          assessment.artifactId,
      );

  const blockedHistoricalRecordIds =
    historicalAssessments
      .filter(
        assessment =>
          assessment.decision ===
          "BLOCKED",
      )
      .map(
        assessment =>
          assessment.recordId,
      );

  /*
   * Preserve the existing contract identity for callers that have
   * not yet opted into the historical lane.
   *
   * Once Runtime supplies historicalAssessments explicitly, those
   * assessments become part of the deterministic contract identity.
   */
  const contractIdentity =
    input.historicalAssessments
      ? {
          dayZeroCertificationId:
            input.dayZero
              .certification
              .certificationId,

          dayZeroCandidateId:
            input.dayZero
              .candidate
              .candidateId,

          assessments,

          historicalAssessments,

          authorityResolutions:
            (
              input.authorityResolutions ??
              []
            )
              .filter(
                resolution =>
                  resolution.authorityPolicyVersion ===
                    EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION &&
                  resolution.dayZeroCertificationId ===
                    dayZeroCertificationId,
              )
              .map(
                resolution => ({
                  resolutionId:
                    resolution.resolutionId,

                  artifactId:
                    resolution.artifactId,

                  learningRole:
                    resolution.learningRole,

                  reviewerId:
                    resolution.reviewerId,

                  reviewedAt:
                    resolution.reviewedAt,
                }),
              )
              .sort(
                (
                  left,
                  right,
                ) =>
                  left.artifactId.localeCompare(
                    right.artifactId,
                  ),
              ),
        }
      : {
          dayZeroCertificationId:
            input.dayZero
              .certification
              .certificationId,

          dayZeroCandidateId:
            input.dayZero
              .candidate
              .candidateId,

          assessments,
        };

  const contractId =
    `educational-corpus-source-contract:${hash(contractIdentity)}` as EducationalCorpusSourceContractId;

  return {
    contractId,

    dayZeroCertificationId:
      input.dayZero
        .certification
        .certificationId,

    dayZeroCandidateId:
      input.dayZero
        .candidate
        .candidateId,

    assessments,

    historicalAssessments,

    summary,

    unresolvedArtifactIds,

    blockedHistoricalRecordIds,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,
  };
}

/*
 * Historical evidence is deliberately additive to the source contract.
 *
 * It does not change the meaning of canonical authority assessments,
 * and it does not automatically enter EducationalCorpus assembly.
 */
