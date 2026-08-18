import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveApproval,
  type ExecutiveApproval,
  type CreateExecutiveApprovalInput,
} from "./ExecutiveApproval.js";

export class ExecutiveApprovalService {

  private readonly approvals =
    new Map<
      string,
      ExecutiveApproval
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveApprovalInput,
  ): ExecutiveApproval {

    const approval =
      createExecutiveApproval(
        input,
      );

    this.approvals.set(
      approval.id,
      approval,
    );

    this.timeline.record({
      id:
        `${approval.id}:pending`,
      sessionId:
        approval.sessionId,
      type:
        "decision-requested",
      actorId:
        approval.requestedBy,
      source:
        "executive-approval",
      title:
        "Approval Requested",
      summary:
        `Approval requested from ${approval.approverId}.`,
      payload: {
        approvalId:
          approval.id,
        decisionId:
          approval.decisionId,
      },
    });

    return approval;
  }

  approve(
    approvalId: string,
  ): ExecutiveApproval {

    const approval =
      this.approvals.get(
        approvalId,
      );

    if (!approval) {
      throw new Error(
        `Unknown approval "${approvalId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...approval,
        status:
          "approved" as const,
        decidedAt:
          Date.now(),
      });

    this.approvals.set(
      approvalId,
      updated,
    );

    this.timeline.record({
      id:
        `${approvalId}:approved`,
      sessionId:
        updated.sessionId,
      type:
        "decision-approved",
      actorId:
        updated.approverId,
      source:
        "executive-approval",
      title:
        "Decision Approved",
      summary:
        "Approval granted.",
      payload: {
        approvalId,
        decisionId:
          updated.decisionId,
      },
    });

    return updated;
  }

  reject(
    approvalId: string,
    reason: string,
  ): ExecutiveApproval {

    const approval =
      this.approvals.get(
        approvalId,
      );

    if (!approval) {
      throw new Error(
        `Unknown approval "${approvalId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...approval,
        status:
          "rejected" as const,
        comments:
          reason,
        decidedAt:
          Date.now(),
      });

    this.approvals.set(
      approvalId,
      updated,
    );

    this.timeline.record({
      id:
        `${approvalId}:rejected`,
      sessionId:
        updated.sessionId,
      type:
        "decision-rejected",
      actorId:
        updated.approverId,
      source:
        "executive-approval",
      title:
        "Decision Rejected",
      summary:
        reason,
      payload: {
        approvalId,
        decisionId:
          updated.decisionId,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.approvals.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.approvals.values(),
      ),
    );
  }

  clear(): void {
    this.approvals.clear();
  }
}

export function
createExecutiveApprovalService() {
  return new ExecutiveApprovalService();
}
