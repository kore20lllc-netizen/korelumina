import {
  createHash,
} from "node:crypto";

import type {
  InitialCompetencyHumanAcceptanceRuntimeProjection,
} from "./InitialCompetencyHumanAcceptanceService.js";


export const CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION =
  "chief-agent-production-workspace-authorization:v1" as const;


export type ChiefAgentProductionWorkspaceAuthorizationId =
  `chief-agent-production-workspace-authorization:${string}`;


export const CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE =
  "HUMAN_GOVERNANCE" as const;


export interface ChiefAgentProductionWorkspaceAuthorizationDecision {
  authorizedBy:
    string;

  authorityRole:
    typeof CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE;

  authorizedAt:
    number;

  reason:
    string;
}


export interface ChiefAgentProductionWorkspaceAuthorization {
  authorizationId:
    ChiefAgentProductionWorkspaceAuthorizationId;

  authorizationVersion:
    typeof CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION;

  state:
    "AUTHORIZED";

  humanAcceptanceId:
    string;

  initialCompetencyCertificationId:
    string;

  initialCompetencyCandidateId:
    string;

  educationalCorpusCertificationId:
    string;

  authorizedBy:
    string;

  authorityRole:
    typeof CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE;

  authorizedAt:
    number;

  reason:
    string;

  downstream: {
    initialCompetencyCertified:
      true;

    humanAcceptanceRecorded:
      true;

    chiefAgentProductionWorkspaceAuthorized:
      true;

    chiefAgentProductionWorkspaceCreated:
      false;

    chiefAgentActivationAuthorized:
      false;

    chiefAgentActivated:
      false;
  };
}


export type ChiefAgentProductionWorkspaceAuthorizationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface ChiefAgentProductionWorkspaceAuthorizationValidation {
  state:
    ChiefAgentProductionWorkspaceAuthorizationValidationState;

  authorizationId:
    ChiefAgentProductionWorkspaceAuthorizationId;

  currentHumanAcceptanceId:
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
      `chief_agent_production_workspace_authorization_${field}_required`,
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
      "chief_agent_production_workspace_authorization_timestamp_invalid",
    );
  }

  return value;
}


function assertAcceptanceAuthorizable(
  projection:
    InitialCompetencyHumanAcceptanceRuntimeProjection,
): void {
  if (
    projection.state !==
      "VALID"
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_acceptance_not_valid",
    );
  }

  if (
    projection.acceptance ===
      null
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_acceptance_missing",
    );
  }

  if (
    projection.validation ===
      null ||
    projection.validation.state !==
      "VALID"
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_acceptance_validation_not_valid",
    );
  }

  if (
    projection.downstream
      .initialCompetencyCertified !==
      true
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_competency_not_certified",
    );
  }

  if (
    projection.downstream
      .humanAcceptanceRecorded !==
      true
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_human_acceptance_missing",
    );
  }

  if (
    projection.downstream
      .chiefAgentProductionWorkspaceAuthorized !==
      false ||
    projection.downstream
      .chiefAgentActivationAuthorized !==
      false
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_upstream_boundary_invalid",
    );
  }
}


export function authorizeChiefAgentProductionWorkspace(
  input: {
    acceptance:
      InitialCompetencyHumanAcceptanceRuntimeProjection;

    decision:
      ChiefAgentProductionWorkspaceAuthorizationDecision;
  },
): ChiefAgentProductionWorkspaceAuthorization {
  assertAcceptanceAuthorizable(
    input.acceptance,
  );

  const acceptance =
    input.acceptance
      .acceptance;

  if (
    acceptance ===
      null
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_acceptance_missing",
    );
  }

  if (
    input.decision
      .authorityRole !==
    CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE
  ) {
    throw new Error(
      "chief_agent_production_workspace_authorization_role_invalid",
    );
  }

  const authorizedBy =
    required(
      input.decision
        .authorizedBy,
      "authorized_by",
    );

  const authorizedAt =
    timestamp(
      input.decision
        .authorizedAt,
    );

  const reason =
    required(
      input.decision
        .reason,
      "reason",
    );

  const authorizationId =
    `chief-agent-production-workspace-authorization:${hash({
      authorizationVersion:
        CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION,

      humanAcceptanceId:
        acceptance.acceptanceId,

      initialCompetencyCertificationId:
        acceptance.initialCompetencyCertificationId,

      initialCompetencyCandidateId:
        acceptance.initialCompetencyCandidateId,

      educationalCorpusCertificationId:
        acceptance.educationalCorpusCertificationId,

      authorizedBy,

      authorityRole:
        input.decision
          .authorityRole,

      authorizedAt,

      reason,
    })}` as ChiefAgentProductionWorkspaceAuthorizationId;

  return {
    authorizationId,

    authorizationVersion:
      CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORIZATION_VERSION,

    state:
      "AUTHORIZED",

    humanAcceptanceId:
      acceptance.acceptanceId,

    initialCompetencyCertificationId:
      acceptance.initialCompetencyCertificationId,

    initialCompetencyCandidateId:
      acceptance.initialCompetencyCandidateId,

    educationalCorpusCertificationId:
      acceptance.educationalCorpusCertificationId,

    authorizedBy,

    authorityRole:
      CHIEF_AGENT_PRODUCTION_WORKSPACE_AUTHORITY_ROLE,

    authorizedAt,

    reason,

    downstream: {
      initialCompetencyCertified:
        true,

      humanAcceptanceRecorded:
        true,

      chiefAgentProductionWorkspaceAuthorized:
        true,

      chiefAgentProductionWorkspaceCreated:
        false,

      chiefAgentActivationAuthorized:
        false,

      chiefAgentActivated:
        false,
    },
  };
}


export function validateChiefAgentProductionWorkspaceAuthorization(
  input: {
    authorization:
      ChiefAgentProductionWorkspaceAuthorization;

    currentAcceptance:
      InitialCompetencyHumanAcceptanceRuntimeProjection;
  },
): ChiefAgentProductionWorkspaceAuthorizationValidation {
  const blockers:
    string[] =
      [];

  const current =
    input.currentAcceptance;

  const acceptance =
    current.acceptance;

  if (
    current.state !==
      "VALID"
  ) {
    blockers.push(
      "current-human-acceptance-not-valid",
    );
  }

  if (
    acceptance ===
      null
  ) {
    blockers.push(
      "current-human-acceptance-missing",
    );
  } else {
    if (
      acceptance.acceptanceId !==
        input.authorization
          .humanAcceptanceId
    ) {
      blockers.push(
        "human-acceptance-changed",
      );
    }

    if (
      acceptance.initialCompetencyCertificationId !==
        input.authorization
          .initialCompetencyCertificationId
    ) {
      blockers.push(
        "initial-competency-certification-changed",
      );
    }

    if (
      acceptance.initialCompetencyCandidateId !==
        input.authorization
          .initialCompetencyCandidateId
    ) {
      blockers.push(
        "initial-competency-candidate-changed",
      );
    }

    if (
      acceptance.educationalCorpusCertificationId !==
        input.authorization
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
    ChiefAgentProductionWorkspaceAuthorizationValidationState =
      current.state !==
        "VALID" ||
      acceptance ===
        null
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "STALE"
          : "VALID";

  return {
    state,

    authorizationId:
      input.authorization
        .authorizationId,

    currentHumanAcceptanceId:
      acceptance
        ?.acceptanceId ??
      null,

    blockers:
      normalizedBlockers,
  };
}
