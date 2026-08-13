import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveActionExecutionAuthorizationService,
  ExecutiveActionService,
} from "../../executive/action/index.js";

import {
  ExecutiveDelegationService,
} from "../../executive/delegation/index.js";

import {
  registerExecutiveActionRoute,
} from "../executiveAction.js";

async function closeServer(
  server:
    Server,
) {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) =>
      server.close(
        (error) =>
          error
            ? reject(
                error,
              )
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
    },
  );

  const server =
    app.listen(
      0,
    );

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

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function createReadyPair(
  actionService:
    ExecutiveActionService,
  delegationService:
    ExecutiveDelegationService,
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
        "Governed work",

      description:
        "Accepted delegated work.",
    });

  const acceptedDelegation =
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
        acceptedDelegation.id,

      title:
        "Governed work",

      description:
        "Ready for authorization.",

      ownerId:
        acceptedDelegation.assignedTo,

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

  return {
    action,
    delegation:
      acceptedDelegation,
  };
}

test(
  "assigned owner can explicitly authorize ready action without starting execution",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createReadyPair(
          context.actionService,
          context.delegationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/authorize-execution`,
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
        body.authorization.actionId,
        pair.action.id,
      );

      assert.equal(
        body.authorization.actorId,
        pair.action.ownerId,
      );

      assert.equal(
        body.authorization.consumedAt,
        undefined,
      );

      assert.equal(
        body.action.status,
        "ready",
      );

      assert.equal(
        body.action.startedAt,
        undefined,
      );

      assert.equal(
        body.delegation.status,
        "accepted",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "non-owner cannot authorize execution",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createReadyPair(
          context.actionService,
          context.delegationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/authorize-execution`,
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
        context.actionService
          .get(
            pair.action.id,
          )
          ?.startedAt,
        undefined,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "same action cannot receive duplicate execution authorization",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createReadyPair(
          context.actionService,
          context.delegationService,
        );

      const url =
        `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/authorize-execution`;

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

            body:
              JSON.stringify({
                actorId:
                  pair.action.ownerId,
              }),
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

            body:
              JSON.stringify({
                actorId:
                  pair.action.ownerId,

                authorizationId:
                  "execution-authorization:second",
              }),
          },
        );

      assert.equal(
        second.status,
        409,
      );

      const body =
        await second.json();

      assert.equal(
        body.error,
        "executive_action_already_execution_authorized",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "authorization endpoint never transitions action to running",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createReadyPair(
          context.actionService,
          context.delegationService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(pair.action.id)}/authorize-execution`,
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
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const current =
        context.actionService.get(
          pair.action.id,
        );

      assert.equal(
        current?.status,
        "ready",
      );

      assert.notEqual(
        current?.status,
        "running",
      );

      assert.equal(
        current?.startedAt,
        undefined,
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
