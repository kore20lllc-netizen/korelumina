import {
  createHash,
} from "node:crypto";

/*
 * ADR-0041 Decision 2 (KO-5c): activation is an immutable, versioned,
 * append-only record. Suspension, resumption and revocation are new records
 * that reference the one before, each with a human reason.
 */

export const CHIEF_AGENT_ACTIVATION_VERSION =
  "chief-agent-activation:v1" as const;

export const CHIEF_AGENT_ACTIVATION_AUTHORITY_ROLE =
  "HUMAN_GOVERNANCE" as const;

/*
 * Only PROPOSE_ONLY is defined. Any higher level requires its own decision
 * record (ADR-0041 Decision 4).
 */
export const CHIEF_AGENT_AUTONOMY_LEVELS =
  [
    "PROPOSE_ONLY",
  ] as const;

export type ChiefAgentAutonomyLevel =
  typeof CHIEF_AGENT_AUTONOMY_LEVELS[number];

export type ChiefAgentActivationAction =
  | "ACTIVATE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE";

export type ChiefAgentActivationRecordState =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export interface ChiefAgentActivationBindings {
  dayZeroCertificationId:
    string;

  educationalCorpusCertificationId:
    string;

  initialCompetencyCertificationId:
    string;

  initialCompetencyHumanAcceptanceId:
    string;

  productionWorkspaceAuthorizationId:
    string;
}

export interface ChiefAgentActivationRecord {
  recordId:
    string;

  version:
    typeof CHIEF_AGENT_ACTIVATION_VERSION;

  sequence:
    number;

  activationId:
    string;

  previousRecordId:
    string | null;

  action:
    ChiefAgentActivationAction;

  state:
    ChiefAgentActivationRecordState;

  autonomyLevel:
    ChiefAgentAutonomyLevel;

  bindings:
    ChiefAgentActivationBindings;

  decidedBy:
    string;

  authorityRole:
    typeof CHIEF_AGENT_ACTIVATION_AUTHORITY_ROLE;

  decidedAt:
    number;

  reason:
    string;
}

export function stateAfter(
  action:
    ChiefAgentActivationAction,
): ChiefAgentActivationRecordState {
  switch (action) {
    case "ACTIVATE":
    case "RESUME":
      return "ACTIVE";

    case "SUSPEND":
      return "SUSPENDED";

    case "REVOKE":
      return "REVOKED";
  }
}

export function createChiefAgentActivationRecord(
  input:
    Omit<
      ChiefAgentActivationRecord,
      | "recordId"
      | "version"
      | "state"
      | "activationId"
      | "authorityRole"
    > & {
      activationId:
        string | null;
    },
): ChiefAgentActivationRecord {
  const body = {
    version:
      CHIEF_AGENT_ACTIVATION_VERSION,

    sequence:
      input.sequence,

    previousRecordId:
      input.previousRecordId,

    action:
      input.action,

    state:
      stateAfter(
        input.action,
      ),

    autonomyLevel:
      input.autonomyLevel,

    bindings:
      input.bindings,

    decidedBy:
      input.decidedBy,

    authorityRole:
      CHIEF_AGENT_ACTIVATION_AUTHORITY_ROLE,

    decidedAt:
      input.decidedAt,

    reason:
      input.reason,
  };

  const recordId =
    `chief-agent-activation-record:${createHash(
      "sha256",
    )
      .update(
        JSON.stringify(
          body,
        ),
      )
      .digest(
        "hex",
      )}`;

  return {
    recordId,

    /*
     * The activation's identity is its ACTIVATE record. Later records of
     * the same activation carry it forward.
     */
    activationId:
      input.action ===
        "ACTIVATE"
        ? recordId.replace(
            "chief-agent-activation-record:",
            "chief-agent-activation:",
          )
        : input.activationId ?? "",

    ...body,
  };
}
