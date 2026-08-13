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

async function startServer(
  actionService:
    ExecutiveActionService,
) {
  const app =
    express();

  registerExecutiveActionRoute(
    app,
    {
      actionService,

      delegationService:
        new ExecutiveDelegationService(),

      executionAuthorizationService:
        new ExecutiveActionExecutionAuthorizationService(),

      executionStartService:
        new ExecutiveActionExecutionStartService(
          actionService,
          new ExecutiveDelegationService(),
          new ExecutiveActionExecutionAuthorizationService(),
          new ExecutiveAuditService(),
        ),
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

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

test(
  "reads a planned executive action",
  async () => {
    const actionService =
      new ExecutiveActionService();

    const action =
      actionService.create({
        id:
          "action:decision:test",

        sessionId:
          "session:test",

        delegationId:
          "delegation:decision:test",

        title:
          "Governed action",

        description:
          "Awaiting acceptance.",

        ownerId:
          "agent:architecture-engineer",

        status:
          "planned",
      });

    const context =
      await startServer(
        actionService,
      );

    try {
      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(action.id)}`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.action.id,
        action.id,
      );

      assert.equal(
        body.action.status,
        "planned",
      );

      assert.equal(
        body.action.startedAt,
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
  "reads a ready action without implying execution",
  async () => {
    const actionService =
      new ExecutiveActionService();

    const created =
      actionService.create({
        id:
          "action:ready",

        sessionId:
          "session:ready",

        delegationId:
          "delegation:ready",

        title:
          "Ready action",

        description:
          "Accepted but not running.",

        ownerId:
          "agent:executor",

        status:
          "planned",
      });

    actionService.updateStatus(
      created.id,
      "ready",
    );

    const context =
      await startServer(
        actionService,
      );

    try {
      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent(created.id)}`,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

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
  "returns 404 for an unknown executive action",
  async () => {
    const context =
      await startServer(
        new ExecutiveActionService(),
      );

    try {
      const response =
        await fetch(
          `${context.baseUrl}/api/executive/actions/${encodeURIComponent("action:missing")}`,
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_action_not_found",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
