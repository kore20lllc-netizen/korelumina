import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerExecutiveActionExecutionRoute,
} from "../executiveActionExecution.js";

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

test(
  "live route accepts filesystem.read only and never accepts executor name",
  async () => {
    let received:
      unknown;

    const dispatcher = {
      async dispatch(
        input: unknown,
      ) {
        received =
          input;

        return {
          action: {
            status:
              "completed",
          },

          delegation: {
            status:
              "completed",
          },

          audit: {
            id:
              "audit:test",
          },

          executionResult: {
            ok:
              true,

            summary:
              "Read file.",

            evidence:
              [],

            metadata: {
              content:
                "hello",
            },
          },
        };
      },
    };

    const app =
      express();

    app.use(
      express.json(),
    );

    registerExecutiveActionExecutionRoute(
      app,
      dispatcher as never,
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

    try {
      const response =
        await fetch(
          `http://127.0.0.1:${address.port}/api/executive/actions/action%3Atest/execute-operation`,
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
                  "agent:test",

                authorizationId:
                  "authorization:test",

                startAuditId:
                  "audit:start:test",

                executorName:
                  "malicious-selector",

                operation: {
                  type:
                    "filesystem.read",

                  path:
                    "README.md",
                },
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
        body.executionResult
          .metadata
          .content,
        "hello",
      );

      assert.deepEqual(
        received,
        {
          actionId:
            "action:test",

          actorId:
            "agent:test",

          authorizationId:
            "authorization:test",

          startAuditId:
            "audit:start:test",

          operation: {
            type:
              "filesystem.read",

            path:
              "README.md",
          },
        },
      );
    } finally {
      await closeServer(
        server,
      );
    }
  },
);

test(
  "live route rejects non-read operation before dispatcher",
  async () => {
    let invoked =
      false;

    const dispatcher = {
      async dispatch() {
        invoked =
          true;

        throw new Error(
          "must_not_dispatch",
        );
      },
    };

    const app =
      express();

    app.use(
      express.json(),
    );

    registerExecutiveActionExecutionRoute(
      app,
      dispatcher as never,
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

    try {
      const response =
        await fetch(
          `http://127.0.0.1:${address.port}/api/executive/actions/action%3Atest/execute-operation`,
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
                  "agent:test",

                authorizationId:
                  "authorization:test",

                startAuditId:
                  "audit:start:test",

                operation: {
                  type:
                    "filesystem.write",

                  path:
                    "README.md",

                  content:
                    "mutation",
                },
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
        "executive_execution_operation_not_live_enabled",
      );

      assert.equal(
        invoked,
        false,
      );
    } finally {
      await closeServer(
        server,
      );
    }
  },
);
