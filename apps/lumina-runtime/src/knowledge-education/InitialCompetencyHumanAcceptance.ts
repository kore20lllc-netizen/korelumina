import {
  createHash,
} from "node:crypto";

import type {
  InitialCompetencyCertificationRuntimeProjection,
} from "./InitialCompetencyCertificationService.js";


export const INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION =
  "initial-competency-human-acceptance:v1" as const;


export type InitialCompetencyHumanAcceptanceId =
  `initial-competency-human-acceptance:${string}`;


export interface InitialCompetencyHumanAcceptanceDecision {
  acceptedBy:
    string;

  acceptedAt:
    number;

  reason:
    string;
}


export interface InitialCompetencyHumanAcceptance {
  acceptanceId:
    InitialCompetencyHumanAcceptanceId;

  acceptanceVersion:
    typeof INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION;

  state:
    "ACCEPTED";

  initialCompetencyCertificationId:
    string;

  initialCompetencyCandidateId:
    string;

  educationalCorpusCertificationId:
    string;

  acceptedBy:
    string;

  acceptedAt:
    number;

  reason:
    string;

  downstream: {
    initialCompetencyCertified:
      true;

    humanAcceptanceRecorded:
      true;

    chiefAgentProductionWorkspaceAuthorized:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export type InitialCompetencyHumanAcceptanceValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface InitialCompetencyHumanAcceptanceValidation {
  state:
    InitialCompetencyHumanAcceptanceValidationState;

  acceptanceId:
    InitialCompetencyHumanAcceptanceId;

  currentInitialCompetencyCertificationId:
    string | null;

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
      `initial_competency_human_acceptance_${field}_required`,
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
      "initial_competency_human_acceptance_timestamp_invalid",
    );
  }

  return value;
}


function assertCertificationAcceptable(
  projection:
    InitialCompetencyCertificationRuntimeProjection,
): void {
  if (
    projection.state !==
      "VALID"
  ) {
    throw new Error(
      "initial_competency_human_acceptance_certification_not_valid",
    );
  }

  if (
    projection.certification ===
      null
  ) {
    throw new Error(
      "initial_competency_human_acceptance_certification_missing",
    );
  }

  if (
    projection.validation ===
      null ||
    projection.validation.state !==
      "VALID"
  ) {
    throw new Error(
      "initial_competency_human_acceptance_validation_not_valid",
    );
  }

  if (
    projection.downstream
      .initialCompetencyCertified !==
      true
  ) {
    throw new Error(
      "initial_competency_human_acceptance_competency_not_certified",
    );
  }

  if (
    projection.downstream
      .chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "initial_competency_human_acceptance_upstream_boundary_invalid",
    );
  }
}


export function acceptInitialCompetency(
  input: {
    certification:
      InitialCompetencyCertificationRuntimeProjection;

    decision:
      InitialCompetencyHumanAcceptanceDecision;
  },
): InitialCompetencyHumanAcceptance {
  assertCertificationAcceptable(
    input.certification,
  );

  const certification =
    input.certification
      .certification;

  if (
    certification ===
      null
  ) {
    throw new Error(
      "initial_competency_human_acceptance_certification_missing",
    );
  }

  const acceptedBy =
    required(
      input.decision
        .acceptedBy,
      "accepted_by",
    );

  const acceptedAt =
    timestamp(
      input.decision
        .acceptedAt,
    );

  const reason =
    required(
      input.decision
        .reason,
      "reason",
    );

  const acceptanceId =
    `initial-competency-human-acceptance:${hash({
      acceptanceVersion:
        INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION,

      initialCompetencyCertificationId:
        certification.certificationId,

      initialCompetencyCandidateId:
        certification.candidateId,

      educationalCorpusCertificationId:
        certification.educationalCorpusCertificationId,

      acceptedBy,

      acceptedAt,

      reason,
    })}` as InitialCompetencyHumanAcceptanceId;

  return {
    acceptanceId,

    acceptanceVersion:
      INITIAL_COMPETENCY_HUMAN_ACCEPTANCE_VERSION,

    state:
      "ACCEPTED",

    initialCompetencyCertificationId:
      certification.certificationId,

    initialCompetencyCandidateId:
      certification.candidateId,

    educationalCorpusCertificationId:
      certification.educationalCorpusCertificationId,

    acceptedBy,

    acceptedAt,

    reason,

    downstream: {
      initialCompetencyCertified:
        true,

      humanAcceptanceRecorded:
        true,

      chiefAgentProductionWorkspaceAuthorized:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


export function validateInitialCompetencyHumanAcceptance(
  input: {
    acceptance:
      InitialCompetencyHumanAcceptance;

    currentCertification:
      InitialCompetencyCertificationRuntimeProjection;
  },
): InitialCompetencyHumanAcceptanceValidation {
  const blockers:
    string[] =
      [];

  const current =
    input.currentCertification;

  const currentCertification =
    current.certification;

  if (
    current.state !==
      "VALID"
  ) {
    blockers.push(
      "current-initial-competency-certification-not-valid",
    );
  }

  if (
    currentCertification ===
      null
  ) {
    blockers.push(
      "current-initial-competency-certification-missing",
    );
  } else {
    if (
      currentCertification.certificationId !==
        input.acceptance
          .initialCompetencyCertificationId
    ) {
      blockers.push(
        "initial-competency-certification-changed",
      );
    }

    if (
      currentCertification.candidateId !==
        input.acceptance
          .initialCompetencyCandidateId
    ) {
      blockers.push(
        "initial-competency-candidate-changed",
      );
    }

    if (
      currentCertification.educationalCorpusCertificationId !==
        input.acceptance
          .educationalCorpusCertificationId
    ) {
      blockers.push(
        "educational-corpus-certification-changed",
      );
    }
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    InitialCompetencyHumanAcceptanceValidationState =
      current.state !==
        "VALID" ||
      currentCertification ===
        null
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "STALE"
          : "VALID";

  return {
    state,

    acceptanceId:
      input.acceptance
        .acceptanceId,

    currentInitialCompetencyCertificationId:
      currentCertification
        ?.certificationId ??
      null,

    blockers:
      normalizedBlockers,
  };
}
