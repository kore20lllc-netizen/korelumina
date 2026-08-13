import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveActionExecutionAuthorizationService,
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

  const executionAuthorizationService =
    new ExecutiveActionExecutionAuthorizationService();

  const auditService =
    new ExecutiveAuditService();

  const executionStartService =
    new ExecutiveActionExecutionStartService(
      actionService,
      delegationService,
      executionAuthorizationService,
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
      executionAuthorizationService,
      executionStartService,
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
    executionAuthorizationService,
    auditService,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function createAuthorizedReadyPair(
  actionService:
    ExecutiveActionService,
  delegationService:
    ExecutiveDelegationService,
  authorizationService:
    ExecutiveActionExecutionAuthorizationService,
) {
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
        "Accepted delegated work.",
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
        "Ready to start.",

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

  return {
    action,
    delegation:
      accepted,
    authorization,
  };
}

test(
  "exact owner can start exact authorized action",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createAuthorizedReadyPair(
          context.actionService,
          context.delegationService,
          context.executionAuthorizationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/start-execution`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  pair.action.ownerId,

                authorizationId:
                  pair.authorization.id,
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
        "running",
      );

      assert.equal(
        typeof body.action.startedAt,
        "number",
      );

      assert.equal(
        body.delegation.status,
        "in-progress",
      );

      assert.equal(
        typeof body.authorization.consumedAt,
        "number",
      );

      assert.equal(
        body.audit.source,
        "executive-action-execution-start",
      );

      assert.ok(
        body.audit.evidence.includes(
          pair.authorization.id,
        ),
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "wrong actor cannot start execution",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createAuthorizedReadyPair(
          context.actionService,
          context.delegationService,
          context.executionAuthorizationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/start-execution`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  "agent:other",

                authorizationId:
                  pair.authorization.id,
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
            pair.action.id,
          )
          ?.status,
        "ready",
      );

      assert.equal(
        context.executionAuthorizationService
          .get(
            pair.authorization.id,
          )
          ?.consumedAt,
        undefined,
      );

      assert.equal(
        context.auditService
          .list()
          .length,
        0,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "consumed authorization cannot start execution again",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createAuthorizedReadyPair(
          context.actionService,
          context.delegationService,
          context.executionAuthorizationService,
        );

      const url =
        `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/start-execution`;

      const body =
        JSON.stringify({
          actorId:
            pair.action.ownerId,

          authorizationId:
            pair.authorization.id,
        });

      const first =
        await fetch(
          url,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body,
          },
        );

      assert.equal(
        first.status,
        200,
      );

      const second =
        await fetch(
          url,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body,
          },
        );

      assert.equal(
        second.status,
        409,
      );

      assert.equal(
        context.auditService
          .list()
          .length,
        1,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "start route performs no completion or external execution",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createAuthorizedReadyPair(
          context.actionService,
          context.delegationService,
          context.executionAuthorizationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/start-execution`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actorId:
                  pair.action.ownerId,

                authorizationId:
                  pair.authorization.id,
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
        "running",
      );

      assert.equal(
        body.action.completedAt,
        undefined,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
