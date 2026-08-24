import {
  createHash,
} from "node:crypto";

import {
  assessEducationalCorpusAuthority,
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


export type EducationalCorpusSourceContractId =
  `educational-corpus-source-contract:${string}`;


export interface EducationalCorpusSourceContract {
  contractId:
    EducationalCorpusSourceContractId;

  dayZeroCertificationId:
    string;

  dayZeroCandidateId:
    string;

  assessments:
    readonly EducationalCorpusAuthorityAssessment[];

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
  };

  unresolvedArtifactIds:
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

  const assessments =
    input.artifacts
      .map(
        artifact =>
          assessEducationalCorpusAuthority({
            artifact,

            dayZero:
              input.dayZero,
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

  const contractId =
    `educational-corpus-source-contract:${hash({
      dayZeroCertificationId:
        input.dayZero
          .certification
          .certificationId,

      dayZeroCandidateId:
        input.dayZero
          .candidate
          .candidateId,

      assessments,
    })}` as EducationalCorpusSourceContractId;

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

    summary,

    unresolvedArtifactIds,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,
  };
}
