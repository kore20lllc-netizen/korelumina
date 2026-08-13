import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveAuditService,
} from "../../audit/index.js";

import {
  ExecutiveDelegationService,
} from "../../delegation/index.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "../ExecutiveActionExecutionAuthorizationService.js";

import {
  ExecutiveActionExecutionOutcomeService,
} from "../ExecutiveActionExecutionOutcomeService.js";

import {
  ExecutiveActionExecutionStartService,
} from "../ExecutiveActionExecutionStartService.js";

import {
  ExecutiveActionService,
} from "../ExecutiveActionService.js";

function createRunningContext() {
  const actionService =
    new ExecutiveActionService();

  const delegationService =
    new ExecutiveDelegationService();

  const authorizationService =
    new ExecutiveActionExecutionAuthorizationService();

  const auditService =
    new ExecutiveAuditService();

  const delegation =
    delegationService.create({
      id:
        "delegation:decision:test",

      sessionId:
        "session:test",

      decisionId:
        "decision:test",

      assignedBy:
        "human:reviewer",

      assignedTo:
        "agent:architecture-engineer",

      title:
        "Governed execution",

      description:
        "Execution lifecycle test.",
    });

  const accepted =
    delegationService.updateStatus(
      delegation.id,
      "accepted",
    );

  const action =
    actionService.create({
      id:
        "action:decision:test",

      sessionId:
        "session:test",

      delegationId:
        accepted.id,

      title:
        "Governed execution",

      description:
        "Execution lifecycle test.",

      ownerId:
        accepted.assignedTo,

      status:
        "ready",

      metadata: {
        decisionId:
          "decision:test",

        decisionEvidence: [
          "canonical:architecture:test",
        ],
      },
    });

  const authorization =
    authorizationService.authorize({
      action,
      delegation:
        accepted,

      actorId:
        action.ownerId,
    });

  const startService =
    new ExecutiveActionExecutionStartService(
      actionService,
      delegationService,
      authorizationService,
      auditService,
    );

  const started =
    startService.start({
      actionId:
        action.id,

      authorizationId:
        authorization.id,

      actorId:
        action.ownerId,
    });

  const outcomeService =
    new ExecutiveActionExecutionOutcomeService(
      actionService,
      delegationService,
      auditService,
    );

  return {
    actionService,
    delegationService,
    authorizationService,
    auditService,
    outcomeService,

    action:
      started.action,

    delegation:
      started.delegation,

    startAudit:
      started.audit,
  };
}

test(
  "running action can complete with post-execution audit",
  () => {
    const context =
      createRunningContext();

    const result =
      context.outcomeService.complete({
        actionId:
          context.action.id,

        actorId:
          context.action.ownerId,

        startAuditId:
          context.startAudit.id,

        resultSummary:
          "Architecture update verified.",

        evidence: [
          "verification:build-green",
        ],
      });

    assert.equal(
      result.action.status,
      "completed",
    );

    assert.equal(
      typeof result.action.completedAt,
      "number",
    );

    assert.equal(
      result.delegation.status,
      "completed",
    );

    assert.equal(
      result.audit.source,
      "executive-action-execution-completed",
    );

    assert.equal(
      result.audit.status,
      "closed",
    );

    assert.ok(
      result.audit.evidence.includes(
        "canonical:architecture:test",
      ),
    );

    assert.ok(
      result.audit.evidence.includes(
        context.startAudit.id,
      ),
    );

    assert.ok(
      result.audit.evidence.includes(
        "verification:build-green",
      ),
    );
  },
);

test(
  "running action can fail with explicit compensation obligation",
  () => {
    const context =
      createRunningContext();

    const result =
      context.outcomeService.fail({
        actionId:
          context.action.id,

        actorId:
          context.action.ownerId,

        startAuditId:
          context.startAudit.id,

        failureReason:
          "Verification failed.",

        compensationRequired:
          true,

        compensationPlan:
          "Restore the pre-execution governed state.",
      });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      typeof result.action.completedAt,
      "number",
    );

    assert.equal(
      result.delegation.status,
      "failed",
    );

    assert.equal(
      result.audit.source,
      "executive-action-execution-failed",
    );

    assert.equal(
      result.audit.severity,
      "error",
    );

    assert.equal(
      result.audit.status,
      "open",
    );

    assert.equal(
      result.audit.metadata.compensationRequired,
      true,
    );

    assert.equal(
      result.audit.metadata.compensationStatus,
      "required",
    );

    assert.deepEqual(
      result.audit.recommendations,
      [
        "Restore the pre-execution governed state.",
      ],
    );
  },
);

test(
  "failure requiring compensation must include a compensation plan",
  () => {
    const context =
      createRunningContext();

    assert.throws(
      () =>
        context.outcomeService.fail({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          startAuditId:
            context.startAudit.id,

          failureReason:
            "Verification failed.",

          compensationRequired:
            true,
        }),
      /executive_execution_compensation_plan_required/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "running",
    );

    assert.equal(
      context.delegationService
        .get(
          context.delegation.id,
        )
        ?.status,
      "in-progress",
    );

    assert.equal(
      context.auditService.list().length,
      1,
    );
  },
);

test(
  "wrong actor cannot resolve execution",
  () => {
    const context =
      createRunningContext();

    assert.throws(
      () =>
        context.outcomeService.complete({
          actionId:
            context.action.id,

          actorId:
            "agent:other",

          startAuditId:
            context.startAudit.id,

          resultSummary:
            "Should not complete.",
        }),
      /executive_execution_outcome_actor_not_authorized/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "running",
    );

    assert.equal(
      context.auditService.list().length,
      1,
    );
  },
);

test(
  "wrong start audit cannot resolve another action",
  () => {
    const context =
      createRunningContext();

    const fakeAudit =
      context.auditService.create({
        id:
          "audit:execution-start:other",

        sessionId:
          "session:test",

        title:
          "Other start",

        description:
          "Other action.",

        source:
          "executive-action-execution-start",

        ownerId:
          context.action.ownerId,

        evidence: [
          "canonical:architecture:test",
        ],

        metadata: {
          actionId:
            "action:other",

          delegationId:
            context.delegation.id,
        },
      });

    assert.throws(
      () =>
        context.outcomeService.complete({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          startAuditId:
            fakeAudit.id,

          resultSummary:
            "Should not complete.",
        }),
      /executive_execution_start_audit_action_mismatch/,
    );

    assert.equal(
      context.actionService
        .get(
          context.action.id,
        )
        ?.status,
      "running",
    );
  },
);

test(
  "completed action cannot be completed twice",
  () => {
    const context =
      createRunningContext();

    context.outcomeService.complete({
      actionId:
        context.action.id,

      actorId:
        context.action.ownerId,

      startAuditId:
        context.startAudit.id,

      resultSummary:
        "Verified.",
    });

    assert.throws(
      () =>
        context.outcomeService.complete({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          startAuditId:
            context.startAudit.id,

          resultSummary:
            "Duplicate.",
        }),
      /executive_action_not_running_for_execution_outcome/,
    );

    assert.equal(
      context.auditService.list().length,
      2,
    );
  },
);

test(
  "failed action cannot later be completed",
  () => {
    const context =
      createRunningContext();

    context.outcomeService.fail({
      actionId:
        context.action.id,

      actorId:
        context.action.ownerId,

      startAuditId:
        context.startAudit.id,

      failureReason:
        "Failed.",

      compensationRequired:
        false,
    });

    assert.throws(
      () =>
        context.outcomeService.complete({
          actionId:
            context.action.id,

          actorId:
            context.action.ownerId,

          startAuditId:
            context.startAudit.id,

          resultSummary:
            "Invalid recovery.",
        }),
      /executive_action_not_running_for_execution_outcome/,
    );
  },
);

test(
  "outcome service performs no external executor or compensation",
  () => {
    const context =
      createRunningContext();

    const result =
      context.outcomeService.fail({
        actionId:
          context.action.id,

        actorId:
          context.action.ownerId,

        startAuditId:
          context.startAudit.id,

        failureReason:
          "External work intentionally absent.",

        compensationRequired:
          true,

        compensationPlan:
          "Compensation remains a governed future obligation.",
      });

    assert.equal(
      result.action.status,
      "failed",
    );

    assert.equal(
      result.audit.metadata.compensationStatus,
      "required",
    );
  },
);
