import type {
  ExecutiveApproval,
} from "../executive/approval/index.js";

import type {
  ExecutiveDelegation,
} from "../executive/delegation/index.js";

import {
  createInitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


export interface MissionBoundariesObservation {
  observedAt:
    number;

  sourceRef:
    string;

  delegation:
    ExecutiveDelegation;

  approval:
    ExecutiveApproval;
}


export interface MissionBoundariesEvidenceAssessment {
  delegationId:
    string;

  eligible:
    boolean;

  missingRequirements:
    readonly string[];

  evidence:
    InitialCompetencyEvidenceRecord |
    null;
}


function nonEmptyString(
  value:
    unknown,
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
    ? value.trim()
    : null;
}


function validTimestamp(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
  );
}


function record(
  value:
    unknown,
): Record<string, unknown> | null {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
    ? value as Record<string, unknown>
    : null;
}


function stringArray(
  value:
    unknown,
): string[] {
  return Array.isArray(
    value,
  )
    ? value.filter(
        (
          entry,
        ): entry is string =>
          typeof entry ===
            "string" &&
          entry.trim().length >
            0,
      )
    : [];
}


export function deriveMissionBoundariesCompetencyEvidence(
  observation:
    MissionBoundariesObservation,
): MissionBoundariesEvidenceAssessment {
  const {
    delegation,
    approval,
  } = observation;

  const missing:
    string[] =
      [];

  const delegationId =
    nonEmptyString(
      delegation.id,
    );

  const sessionId =
    nonEmptyString(
      delegation.sessionId,
    );

  const decisionId =
    nonEmptyString(
      delegation.decisionId,
    );

  const assignedBy =
    nonEmptyString(
      delegation.assignedBy,
    );

  const assignedTo =
    nonEmptyString(
      delegation.assignedTo,
    );

  const sourceRef =
    nonEmptyString(
      observation.sourceRef,
    );

  const approvalDecisionId =
    nonEmptyString(
      approval.decisionId,
    );

  const approvalSessionId =
    nonEmptyString(
      approval.sessionId,
    );

  const approverId =
    nonEmptyString(
      approval.approverId,
    );

  const metadata =
    record(
      delegation.metadata,
    ) ??
    {};

  const decisionStatus =
    nonEmptyString(
      metadata.decisionStatus,
    );

  const approvedBy =
    nonEmptyString(
      metadata.approvedBy,
    );

  const decisionEvidence =
    stringArray(
      metadata.decisionEvidence,
    );

  if (
    !delegationId
  ) {
    missing.push(
      "delegation-id",
    );
  }

  if (
    !sessionId
  ) {
    missing.push(
      "session-id",
    );
  }

  if (
    !decisionId
  ) {
    missing.push(
      "decision-id",
    );
  }

  if (
    !assignedBy
  ) {
    missing.push(
      "delegation-assigner",
    );
  }

  if (
    !assignedTo
  ) {
    missing.push(
      "delegation-assignee",
    );
  }

  if (
    !sourceRef
  ) {
    missing.push(
      "mission-source-ref",
    );
  }

  if (
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    missing.push(
      "observation-time",
    );
  }

  if (
    approval.status !==
      "approved"
  ) {
    missing.push(
      "approved-human-decision",
    );
  }

  if (
    !approverId
  ) {
    missing.push(
      "human-approver",
    );
  }

  if (
    !validTimestamp(
      approval.decidedAt,
    )
  ) {
    missing.push(
      "approval-decision-time",
    );
  }

  if (
    decisionId &&
    approvalDecisionId !==
      decisionId
  ) {
    missing.push(
      "approval-decision-link",
    );
  }

  if (
    sessionId &&
    approvalSessionId !==
      sessionId
  ) {
    missing.push(
      "approval-session-link",
    );
  }

  if (
    decisionStatus !==
      "approved"
  ) {
    missing.push(
      "delegated-decision-approved-state",
    );
  }

  if (
    !approvedBy
  ) {
    missing.push(
      "delegated-decision-approver",
    );
  }

  if (
    decisionEvidence.length ===
      0
  ) {
    missing.push(
      "delegated-decision-evidence",
    );
  }

  const normalizedMissing =
    [
      ...new Set(
        missing,
      ),
    ].sort();

  if (
    normalizedMissing.length >
      0 ||
    !delegationId ||
    !sessionId ||
    !decisionId ||
    !assignedBy ||
    !assignedTo ||
    !sourceRef ||
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    return {
      delegationId:
        delegationId ??
        "",

      eligible:
        false,

      missingRequirements:
        normalizedMissing,

      evidence:
        null,
    };
  }

  const evidence =
    createInitialCompetencyEvidenceRecord({
      evidenceId:
        `competency-evidence:mission-boundaries:${delegationId}:${observation.observedAt}`,

      competencyId:
        "mission-boundaries",

      source:
        "mission",

      sourceRef,

      claim:
        [
          `Governed delegation ${delegationId}`,
          `preserved session ${sessionId},`,
          `approved decision ${decisionId},`,
          `human approval by ${approverId},`,
          `ownership from ${assignedBy} to ${assignedTo},`,
          "and decision evidence across the delegation boundary.",
        ].join(
          " ",
        ),

      observedAt:
        observation.observedAt,
    });

  return {
    delegationId,

    eligible:
      true,

    missingRequirements:
      [],

    evidence,
  };
}
