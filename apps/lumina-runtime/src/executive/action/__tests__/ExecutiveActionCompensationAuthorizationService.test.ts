import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveAuditService,
} from "../../audit/index.js";

import {
  ExecutiveActionCompensationAuthorizationService,
} from "../ExecutiveActionCompensationAuthorizationService.js";

function createFailedAudit(
  auditService:
    ExecutiveAuditService,
) {
  return auditService.create({
    id:
      "audit:execution-failed:action:test",

    sessionId:
      "session:test",

    title:
      "Execution failed",

    description:
      "Mutation requires compensation.",

    source:
      "executive-action-execution-failed",

    ownerId:
      "agent:test",

    severity:
      "error",

    status:
      "open",

    recommendations: [
      "Restore prior governed bytes.",
    ],

    metadata: {
      actionId:
        "action:test",

      outcome:
        "failed",

      compensationRequired:
        true,

      compensationStatus:
        "required",
    },
  });
}

test(
  "open failed compensation obligation can be explicitly authorized",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const failedAudit =
      createFailedAudit(
        auditService,
      );

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    const authorization =
      service.authorize({
        failedAuditId:
          failedAudit.id,

        actorId:
          "agent:test",

        authorizedBy:
          "human:architecture-reviewer",
      });

    assert.equal(
      authorization.actionId,
      "action:test",
    );

    assert.equal(
      authorization.failedAuditId,
      failedAudit.id,
    );

    assert.equal(
      authorization.actorId,
      "agent:test",
    );

    assert.equal(
      authorization.authorizedBy,
      "human:architecture-reviewer",
    );

    assert.equal(
      authorization.consumedAt,
      undefined,
    );
  },
);

test(
  "authorization is single use",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const failedAudit =
      createFailedAudit(
        auditService,
      );

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    const authorization =
      service.authorize({
        failedAuditId:
          failedAudit.id,

        actorId:
          "agent:test",

        authorizedBy:
          "human:architecture-reviewer",
      });

    const consumed =
      service.consume(
        authorization.id,
      );

    assert.equal(
      typeof consumed.consumedAt,
      "number",
    );

    assert.throws(
      () =>
        service.consume(
          authorization.id,
        ),
      /executive_compensation_authorization_already_consumed/,
    );
  },
);

test(
  "closed failed audit cannot create new compensation authorization",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const failedAudit =
      createFailedAudit(
        auditService,
      );

    auditService.updateStatus(
      failedAudit.id,
      "closed",
    );

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    assert.throws(
      () =>
        service.authorize({
          failedAuditId:
            failedAudit.id,

          actorId:
            "agent:test",

          authorizedBy:
            "human:architecture-reviewer",
        }),
      /executive_compensation_obligation_not_open/,
    );
  },
);

test(
  "audit without required compensation cannot be authorized",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const audit =
      auditService.create({
        id:
          "audit:execution-failed:no-compensation",

        sessionId:
          "session:test",

        title:
          "Execution failed",

        description:
          "No rollback required.",

        source:
          "executive-action-execution-failed",

        ownerId:
          "agent:test",

        severity:
          "error",

        status:
          "closed",

        metadata: {
          actionId:
            "action:test",

          compensationRequired:
            false,

          compensationStatus:
            "not-required",
        },
      });

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    assert.throws(
      () =>
        service.authorize({
          failedAuditId:
            audit.id,

          actorId:
            "agent:test",

          authorizedBy:
            "human:architecture-reviewer",
        }),
      /executive_compensation_obligation_not_open|executive_compensation_not_required/,
    );
  },
);

test(
  "compensation actor must match failed execution owner",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const failedAudit =
      createFailedAudit(
        auditService,
      );

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    assert.throws(
      () =>
        service.authorize({
          failedAuditId:
            failedAudit.id,

          actorId:
            "agent:other",

          authorizedBy:
            "human:architecture-reviewer",
        }),
      /executive_compensation_actor_not_authorized/,
    );
  },
);

test(
  "only one compensation authorization may exist per action",
  () => {
    const auditService =
      new ExecutiveAuditService();

    const failedAudit =
      createFailedAudit(
        auditService,
      );

    const service =
      new ExecutiveActionCompensationAuthorizationService(
        auditService,
      );

    service.authorize({
      failedAuditId:
        failedAudit.id,

      actorId:
        "agent:test",

      authorizedBy:
        "human:architecture-reviewer",
    });

    assert.throws(
      () =>
        service.authorize({
          failedAuditId:
            failedAudit.id,

          actorId:
            "agent:test",

          authorizedBy:
            "human:second-reviewer",

          authorizationId:
            "compensation-authorization:second",
        }),
      /executive_action_already_compensation_authorized/,
    );
  },
);
