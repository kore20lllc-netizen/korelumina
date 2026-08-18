import type {
  ExecutiveAuthoritySourceKind,
} from "./ExecutiveInvariant.js";

export type ExecutiveActionRisk =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface ExecutiveAuthorityReference {
  id: string;

  kind:
    ExecutiveAuthoritySourceKind;

  title: string;

  location?: string;

  version?: string;

  verifiedAt?: number;
}

export interface ExecutiveProposalEvidence {
  id: string;

  title: string;

  source: string;

  summary: string;

  observedAt?: number;

  verifiedAt?: number;
}

export interface ExecutiveActionProposal {
  id: string;

  title: string;

  intent: string;

  proposedAction: string;

  rationale: string;

  risk:
    ExecutiveActionRisk;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  invariantIds:
    readonly string[];

  authorityReferences:
    readonly ExecutiveAuthorityReference[];

  evidence:
    readonly ExecutiveProposalEvidence[];

  assumptions:
    readonly string[];

  requestedExceptions:
    readonly string[];

  requiresHumanApproval: boolean;

  humanApprovalId?: string;

  createdBy: string;

  createdAt: number;
}

export interface CreateExecutiveActionProposalInput {
  id: string;

  title: string;

  intent: string;

  proposedAction: string;

  rationale: string;

  risk:
    ExecutiveActionRisk;

  projectId?: string;

  missionId?: string;

  workspace?: string;

  invariantIds?:
    readonly string[];

  authorityReferences?:
    readonly ExecutiveAuthorityReference[];

  evidence?:
    readonly ExecutiveProposalEvidence[];

  assumptions?:
    readonly string[];

  requestedExceptions?:
    readonly string[];

  requiresHumanApproval?: boolean;

  humanApprovalId?: string;

  createdBy: string;

  createdAt?: number;
}

export function createExecutiveActionProposal(
  input:
    CreateExecutiveActionProposalInput,
): ExecutiveActionProposal {
  return Object.freeze({
    ...input,

    invariantIds:
      Object.freeze([
        ...new Set(
          input.invariantIds ?? [],
        ),
      ]),

    authorityReferences:
      Object.freeze(
        (
          input.authorityReferences ??
          []
        ).map(
          (reference) =>
            Object.freeze({
              ...reference,
            }),
        ),
      ),

    evidence:
      Object.freeze(
        (
          input.evidence ??
          []
        ).map(
          (item) =>
            Object.freeze({
              ...item,
            }),
        ),
      ),

    assumptions:
      Object.freeze([
        ...(input.assumptions ?? []),
      ]),

    requestedExceptions:
      Object.freeze([
        ...(
          input.requestedExceptions ??
          []
        ),
      ]),

    requiresHumanApproval:
      input.requiresHumanApproval ??
      (
        input.risk === "high" ||
        input.risk === "critical"
      ),

    createdAt:
      input.createdAt ??
      Date.now(),
  });
}
