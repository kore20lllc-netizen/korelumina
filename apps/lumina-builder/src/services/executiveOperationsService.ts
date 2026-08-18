import {
  getRuntimeCallerHeaders,
  RUNTIME_API,
} from "@/services/runtime/client";

export type ExecutiveReasoningDisposition =
  | "authorize"
  | "review"
  | "deny";

export interface ExecutiveReasoningView {
  id:
    string;

  title:
    string;

  question:
    string;

  conclusion:
    string;

  disposition:
    ExecutiveReasoningDisposition;

  confidence:
    number;

  status:
    string;

  createdAt:
    number;

  updatedAt:
    number;
}

export interface ExecutiveDecisionView {
  id:
    string;

  title:
    string;

  rationale:
    string;

  status:
    string;

  approvedBy?:
    string;

  createdAt:
    number;

  updatedAt:
    number;
}

export interface ExecutiveApprovalView {
  id:
    string;

  decisionId:
    string;

  approverId:
    string;

  status:
    string;

  createdAt:
    number;
}

export interface ExecutiveActionView {
  id:
    string;

  title:
    string;

  description:
    string;

  ownerId:
    string;

  status:
    string;

  createdAt:
    number;

  updatedAt:
    number;
}

export interface ExecutiveAuditView {
  id:
    string;

  title:
    string;

  description:
    string;

  source:
    string;

  severity:
    string;

  status:
    string;

  createdAt:
    number;

  updatedAt:
    number;
}

export interface ExecutiveOperationsSnapshot {
  ok:
    true;

  generatedAt:
    number;

  mutationEnabled:
    boolean;

  summary: {
    reasoning:
      number;

    decisions:
      number;

    pendingApprovals:
      number;

    delegations:
      number;

    actions:
      number;

    openAudits:
      number;
  };

  reasoning:
    ExecutiveReasoningView[];

  decisions:
    ExecutiveDecisionView[];

  approvals:
    ExecutiveApprovalView[];

  delegations:
    unknown[];

  actions:
    ExecutiveActionView[];

  audits:
    ExecutiveAuditView[];
}

export async function getExecutiveOperations():
Promise<ExecutiveOperationsSnapshot> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/executive/operations`,
      {
        headers:
          getRuntimeCallerHeaders(),
      },
    );

  if (!response.ok) {
    throw new Error(
      "failed_to_get_executive_operations",
    );
  }

  return await response.json();
}
