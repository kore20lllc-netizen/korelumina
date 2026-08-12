import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  ExecutiveActionService,
  ExecutiveDelegationActionReadinessService,
} from "../../executive/action/index.js";

import {
  ExecutiveDelegationService,
} from "../../executive/delegation/index.js";

import {
  registerExecutiveDelegationRoute,
} from "../executiveDelegation.js";

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
  const delegationService =
    new ExecutiveDelegationService();

  const actionService =
    new ExecutiveActionService();

  const readinessService =
    new ExecutiveDelegationActionReadinessService(
      delegationService,
      actionService,
    );

  const app =
    express();

  app.use(
    express.json(),
  );

  registerExecutiveDelegationRoute(
    app,
    {
      delegationService,
      readinessService,
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
    delegationService,
    actionService,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function createPair(
  delegationService:
    ExecutiveDelegationService,
  actionService:
    ExecutiveActionService,
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
        "Explicitly delegated.",
    });

  const action =
    actionService.create({
      id:
        "action:decision:test",

      sessionId:
        "session:test",

      delegationId:
        delegation.id,

      title:
        "Governed work",

      description:
        "Explicitly delegated.",

      ownerId:
        delegation.assignedTo,

      status:
        "planned",
    });

  return {
    delegation,
    action,
  };
}

test(
  "assigned owner can accept delegation and move planned action to ready",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createPair(
          context.delegationService,
          context.actionService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/delegations/${encodeURIComponent(pair.delegation.id)}/accept`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actionId:
                  pair.action.id,

                actorId:
                  pair.delegation.assignedTo,
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
        body.delegation.status,
        "accepted",
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

test(
  "non-assignee cannot accept delegation",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createPair(
          context.delegationService,
          context.actionService,
        );

      const response =
        await fetch(
          `${context.baseUrl}/api/executive/delegations/${encodeURIComponent(pair.delegation.id)}/accept`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actionId:
                  pair.action.id,

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
        context.delegationService
          .get(
            pair.delegation.id,
          )
          ?.status,
        "assigned",
      );

      assert.equal(
        context.actionService
          .get(
            pair.action.id,
          )
          ?.status,
        "planned",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "acceptance cannot be repeated",
  async () => {
    const context =
      await startServer();

    try {
      const pair =
        createPair(
          context.delegationService,
          context.actionService,
        );

      const url =
        `${context.baseUrl}/api/executive/delegations/${encodeURIComponent(pair.delegation.id)}/accept`;

      const request = () =>
        fetch(
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
                actionId:
                  pair.action.id,

                actorId:
                  pair.delegation.assignedTo,
              }),
          },
        );

      const first =
        await request();

      assert.equal(
        first.status,
        200,
      );

      const second =
        await request();

      assert.equal(
        second.status,
        409,
      );

      const body =
        await second.json();

      assert.equal(
        body.error,
        "executive_delegation_not_assigned",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
