import {
  createHash,
} from "node:crypto";

import {
  INITIAL_COMPETENCY_ASSESSMENT_VERSION,
} from "./InitialCompetencyAssessmentCandidate.js";

import type {
  InitialCompetencyAssessmentCandidate,
} from "./InitialCompetencyAssessmentCandidate.js";


export const INITIAL_COMPETENCY_CERTIFICATION_VERSION =
  "initial-competency-certification:v1" as const;


export type InitialCompetencyCertificationId =
  `initial-competency-certification:${string}`;


export interface InitialCompetencyCertificationDecision {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;
}


export interface InitialCompetencyCertification {
  certificationId:
    InitialCompetencyCertificationId;

  certificationVersion:
    typeof INITIAL_COMPETENCY_CERTIFICATION_VERSION;

  state:
    "CERTIFIED";

  candidateId:
    InitialCompetencyAssessmentCandidate[
      "candidateId"
    ];

  assessmentVersion:
    typeof INITIAL_COMPETENCY_ASSESSMENT_VERSION;

  educationalCorpusCertificationId:
    string;

  completedCompetencyIds:
    readonly string[];

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  downstream: {
    initialCompetencyCertified:
      true;

    chiefAgentActivationAuthorized:
      false;
  };
}


export type InitialCompetencyCertificationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface InitialCompetencyCertificationValidation {
  state:
    InitialCompetencyCertificationValidationState;

  certificationId:
    InitialCompetencyCertificationId;

  currentCandidateId:
    InitialCompetencyAssessmentCandidate[
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
    normalized.length ===
      0
  ) {
    throw new Error(
      `initial_competency_certification_${field}_required`,
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
      "initial_competency_certification_timestamp_invalid",
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


function assertCandidateCertifiable(
  candidate:
    InitialCompetencyAssessmentCandidate,
): void {
  if (
    candidate.state !==
      "READY_FOR_HUMAN_REVIEW"
  ) {
    throw new Error(
      "initial_competency_certification_candidate_not_ready",
    );
  }

  if (
    !candidate.humanReview
      .required ||
    !candidate.humanReview
      .available
  ) {
    throw new Error(
      "initial_competency_certification_human_review_unavailable",
    );
  }

  if (
    candidate.unresolvedCompetencyIds
      .length >
      0
  ) {
    throw new Error(
      "initial_competency_certification_unresolved_competencies_present",
    );
  }

  if (
    candidate.completedCompetencyIds
      .length !==
    candidate.competencies
      .length
  ) {
    throw new Error(
      "initial_competency_certification_completion_mismatch",
    );
  }

  if (
    candidate.educationalCorpusCertificationId ===
      null
  ) {
    throw new Error(
      "initial_competency_certification_corpus_certification_missing",
    );
  }

  if (
    candidate.downstream
      .initialCompetencyCertified !==
      false ||
    candidate.downstream
      .chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "initial_competency_certification_candidate_downstream_boundary_invalid",
    );
  }
}


export function certifyInitialCompetency(
  input: {
    candidate:
      InitialCompetencyAssessmentCandidate;

    decision:
      InitialCompetencyCertificationDecision;
  },
): InitialCompetencyCertification {
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
    timestamp(
      input.decision
        .certifiedAt,
    );

  const reason =
    required(
      input.decision
        .reason,
      "reason",
    );

  const educationalCorpusCertificationId =
    input.candidate
      .educationalCorpusCertificationId;

  if (
    educationalCorpusCertificationId ===
      null
  ) {
    throw new Error(
      "initial_competency_certification_corpus_certification_missing",
    );
  }

  const completedCompetencyIds =
    sortedUnique(
      input.candidate
        .completedCompetencyIds,
    );

  const certificationId =
    `initial-competency-certification:${hash({
      certificationVersion:
        INITIAL_COMPETENCY_CERTIFICATION_VERSION,

      candidateId:
        input.candidate
          .candidateId,

      assessmentVersion:
        input.candidate
          .assessmentVersion,

      educationalCorpusCertificationId,

      completedCompetencyIds,

      certifiedBy,

      certifiedAt,

      reason,
    })}` as InitialCompetencyCertificationId;

  return {
    certificationId,

    certificationVersion:
      INITIAL_COMPETENCY_CERTIFICATION_VERSION,

    state:
      "CERTIFIED",

    candidateId:
      input.candidate
        .candidateId,

    assessmentVersion:
      input.candidate
        .assessmentVersion,

    educationalCorpusCertificationId,

    completedCompetencyIds,

    certifiedBy,

    certifiedAt,

    reason,

    downstream: {
      initialCompetencyCertified:
        true,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


export function validateInitialCompetencyCertification(
  input: {
    certification:
      InitialCompetencyCertification;

    currentCandidate:
      InitialCompetencyAssessmentCandidate;
  },
): InitialCompetencyCertificationValidation {
  const blockers:
    string[] =
      [];

  const current =
    input.currentCandidate;

  if (
    current.state !==
      "READY_FOR_HUMAN_REVIEW"
  ) {
    blockers.push(
      "current-initial-competency-candidate-not-ready",
    );
  }

  if (
    current.candidateId !==
      input.certification
        .candidateId
  ) {
    blockers.push(
      "initial-competency-certification-candidate-changed",
    );
  }

  if (
    current.assessmentVersion !==
      input.certification
        .assessmentVersion
  ) {
    blockers.push(
      "initial-competency-assessment-version-changed",
    );
  }

  if (
    current.educationalCorpusCertificationId !==
      input.certification
        .educationalCorpusCertificationId
  ) {
    blockers.push(
      "educational-corpus-certification-changed",
    );
  }

  const currentCompleted =
    sortedUnique(
      current
        .completedCompetencyIds,
    );

  const certifiedCompleted =
    sortedUnique(
      input.certification
        .completedCompetencyIds,
    );

  if (
    currentCompleted.length !==
      certifiedCompleted.length ||
    currentCompleted.some(
      (
        competencyId,
        index,
      ) =>
        competencyId !==
        certifiedCompleted[
          index
        ],
    )
  ) {
    blockers.push(
      "initial-competency-completion-set-changed",
    );
  }

  if (
    current.unresolvedCompetencyIds
      .length >
      0
  ) {
    blockers.push(
      "initial-competency-unresolved-domains-present",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    InitialCompetencyCertificationValidationState =
      current.state !==
        "READY_FOR_HUMAN_REVIEW"
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
      current.candidateId,

    blockers:
      normalizedBlockers,
  };
}
