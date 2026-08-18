import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveActionExecutionAuthorizationService,
  ExecutiveActionExecutionOutcomeService,
  ExecutiveActionExecutionStartService,
  ExecutiveActionService,
} from "../../executive/action/index.js";

import {
  ExecutiveAuditService,
} from "../../executive/audit/index.js";

import {
  ExecutiveDelegationService,
} from "../../executive/delegation/index.js";

import {
  registerExecutiveActionRoute,
} from "../executiveAction.js";

async function closeServer(
  server: Server,
) {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) =>
      server.close(
        (error) =>
          error
            ? reject(error)
            : resolve(),
      ),
  );
}

async function startServer() {
  const actionService =
    new ExecutiveActionService();

  const delegationService =
    new ExecutiveDelegationService();

  const authorizationService =
    new ExecutiveActionExecutionAuthorizationService();

  const auditService =
    new ExecutiveAuditService();

  const startService =
    new ExecutiveActionExecutionStartService(
      actionService,
      delegationService,
      authorizationService,
      auditService,
    );

  const outcomeService =
    new ExecutiveActionExecutionOutcomeService(
      actionService,
      delegationService,
      auditService,
    );

  const app =
    express();

  app.use(
    express.json(),
  );

  registerExecutiveActionRoute(
    app,
    {
      actionService,
      delegationService,

      executionAuthorizationService:
        authorizationService,

      executionStartService:
        startService,

      executionOutcomeService:
        outcomeService,
    },
  );

  const server =
    app.listen(0);

  await new Promise<void>(
    (resolve) =>
      server.once(
        "listening",
        resolve,
      ),
  );

  const address =
    server.address();

  if (
    !address ||
    typeof address ===
      "string"
  ) {
    throw new Error(
      "test_server_address_unavailable",
    );
  }

  return {
    server,
    actionService,
    delegationService,
    authorizationService,
    auditService,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function createRunningAction(
  actionService:
    ExecutiveActionService,
  delegationService:
    ExecutiveDelegationService,
  authorizationService:
    ExecutiveActionExecutionAuthorizationService,
  auditService:
    ExecutiveAuditService,
) {
  const delegation =
    delegationService.create({
      id:
        `delegation:test:${Date.now()}`,

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
        "Outcome route test.",
    });

  const accepted =
    delegationService.updateStatus(
      delegation.id,
      "accepted",
    );

  const action =
    actionService.create({
      id:
        `action:test:${Date.now()}`,

      sessionId:
        "session:test",

      delegationId:
        accepted.id,

      title:
        "Governed execution",

      description:
        "Outcome route test.",

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

  return startService.start({
    actionId:
      action.id,

    authorizationId:
      authorization.id,

    actorId:
      action.ownerId,
  });
}

test(
  "running action can complete through live route",
  async () => {
    const context =
      await startServer();

    try {
      const started =
        createRunningAction(
          context.actionService,
          context.delegationService,
          context.authorizationService,
          context.auditService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(started.action.id)}/complete-execution`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  started.action.ownerId,

                startAuditId:
                  started.audit.id,

                resultSummary:
                  "Verified complete.",

                evidence: [
                  "verification:green",
                ],
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.action.status,
        "completed",
      );

      assert.equal(
        body.delegation.status,
        "completed",
      );

      assert.equal(
        typeof body.action.completedAt,
        "number",
      );

      assert.equal(
        body.audit.source,
        "executive-action-execution-completed",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "running action can fail through live route with compensation obligation",
  async () => {
    const context =
      await startServer();

    try {
      const started =
        createRunningAction(
          context.actionService,
          context.delegationService,
          context.authorizationService,
          context.auditService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(started.action.id)}/fail-execution`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  started.action.ownerId,

                startAuditId:
                  started.audit.id,

                failureReason:
                  "Verification failed.",

                compensationRequired:
                  true,

                compensationPlan:
                  "Restore governed pre-execution state.",
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.action.status,
        "failed",
      );

      assert.equal(
        body.delegation.status,
        "failed",
      );

      assert.equal(
        body.audit.metadata
          .compensationStatus,
        "required",
      );

      assert.equal(
        body.audit.status,
        "open",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "wrong actor cannot complete running action",
  async () => {
    const context =
      await startServer();

    try {
      const started =
        createRunningAction(
          context.actionService,
          context.delegationService,
          context.authorizationService,
          context.auditService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(started.action.id)}/complete-execution`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "agent:other",

                startAuditId:
                  started.audit.id,

                resultSummary:
                  "Should fail.",
              }),
          },
        );

      assert.equal(
        response.status,
        403,
      );

      assert.equal(
        context.actionService
          .get(
            started.action.id,
          )
          ?.status,
        "running",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "compensation-required failure without plan is rejected",
  async () => {
    const context =
      await startServer();

    try {
      const started =
        createRunningAction(
          context.actionService,
          context.delegationService,
          context.authorizationService,
          context.auditService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(started.action.id)}/fail-execution`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  started.action.ownerId,

                startAuditId:
                  started.audit.id,

                failureReason:
                  "Verification failed.",

                compensationRequired:
                  true,
              }),
          },
        );

      assert.equal(
        response.status,
        400,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_execution_compensation_plan_required",
      );

      assert.equal(
        context.actionService
          .get(
            started.action.id,
          )
          ?.status,
        "running",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
