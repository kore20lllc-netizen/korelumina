export type ExecutiveApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export interface ExecutiveApproval {

  readonly id: string;

  readonly sessionId: string;

  readonly decisionId: string;

  readonly requestedBy: string;

  readonly approverId: string;

  readonly status:
    ExecutiveApprovalStatus;

  readonly comments: string;

  readonly createdAt: number;

  readonly decidedAt?: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveApprovalInput {

  id: string;

  sessionId: string;

  decisionId: string;

  requestedBy: string;

  approverId: string;

  comments?: string;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveApproval(
  input:
    CreateExecutiveApprovalInput,
): ExecutiveApproval {

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    decisionId:
      input.decisionId.trim(),

    requestedBy:
      input.requestedBy.trim(),

    approverId:
      input.approverId.trim(),

    status:
      "pending",

    comments:
      input.comments ?? "",

    createdAt:
      input.createdAt ??
      Date.now(),

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
