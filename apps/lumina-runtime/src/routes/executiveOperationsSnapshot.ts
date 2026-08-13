import type {
  Express,
  Request,
  Response,
} from "express";

interface ListService<T> {
  list():
    readonly T[];
}

interface Timestamped {
  readonly createdAt?:
    number;

  readonly updatedAt?:
    number;
}

interface ApprovalLike
  extends Timestamped {
  readonly status?:
    string;
}

interface AuditLike
  extends Timestamped {
  readonly status?:
    string;
}

export interface ExecutiveOperationsSnapshotDependencies {
  reasoningService:
    ListService<Timestamped>;

  decisionService:
    ListService<Timestamped>;

  approvalService:
    ListService<ApprovalLike>;

  delegationService:
    ListService<Timestamped>;

  actionService:
    ListService<Timestamped>;

  auditService:
    ListService<AuditLike>;

  mutationEnabled:
    boolean;
}

function newestFirst<T extends Timestamped>(
  values:
    readonly T[],
): T[] {
  return [
    ...values,
  ].sort(
    (
      left,
      right,
    ) =>
      (
        right.updatedAt ??
        right.createdAt ??
        0
      ) -
      (
        left.updatedAt ??
        left.createdAt ??
        0
      ),
  );
}

export function registerExecutiveOperationsSnapshotRoute(
  app:
    Express,

  dependencies:
    ExecutiveOperationsSnapshotDependencies,
): void {
  app.get(
    "/api/executive/operations",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      const reasoning =
        newestFirst(
          dependencies
            .reasoningService
            .list(),
        );

      const decisions =
        newestFirst(
          dependencies
            .decisionService
            .list(),
        );

      const approvals =
        newestFirst(
          dependencies
            .approvalService
            .list(),
        );

      const delegations =
        newestFirst(
          dependencies
            .delegationService
            .list(),
        );

      const actions =
        newestFirst(
          dependencies
            .actionService
            .list(),
        );

      const audits =
        newestFirst(
          dependencies
            .auditService
            .list(),
        );

      return res.json({
        ok:
          true,

        generatedAt:
          Date.now(),

        mutationEnabled:
          dependencies
            .mutationEnabled,

        summary: {
          reasoning:
            reasoning.length,

          decisions:
            decisions.length,

          pendingApprovals:
            approvals.filter(
              (approval) =>
                approval.status ===
                "pending",
            ).length,

          delegations:
            delegations.length,

          actions:
            actions.length,

          openAudits:
            audits.filter(
              (audit) =>
                audit.status ===
                "open",
            ).length,
        },

        reasoning:
          reasoning.slice(
            0,
            20,
          ),

        decisions:
          decisions.slice(
            0,
            20,
          ),

        approvals:
          approvals.slice(
            0,
            20,
          ),

        delegations:
          delegations.slice(
            0,
            20,
          ),

        actions:
          actions.slice(
            0,
            20,
          ),

        audits:
          audits.slice(
            0,
            20,
          ),
      });
    },
  );
}
