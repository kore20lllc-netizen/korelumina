import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerExecutiveActionMutationRoute,
} from "../executiveActionMutation.js";

const SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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

async function createServer(
  enabled:
    boolean,

  dispatcher:
    {
      dispatch(
        input:
          unknown,
      ):
        Promise<unknown>;
    },
) {
  const app =
    express();

  app.use(
    express.json(),
  );

  registerExecutiveActionMutationRoute(
    app,
    dispatcher as never,
    {
      enabled,
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

    url:
      `http://127.0.0.1:${address.port}`,
  };
}

function requestBody() {
  return {
    actorId:
      "agent:test",

    authorizationId:
      "authorization:test",

    startAuditId:
      "audit:start:test",

    operation: {
      type:
        "filesystem.replace",

      path:
        "README.md",

      content:
        "replacement",

      expectedSha256:
        SHA,
    },

    compensation: {
      required:
        true,

      plan:
        "Restore exact prior bytes.",
    },
  };
}

test(
  "mutation route is unavailable when runtime gate is disabled",
  async () => {
    let invoked =
      false;

    const runtime =
      await createServer(
        false,
        {
          async dispatch() {
            invoked =
              true;

            throw new Error(
              "must_not_dispatch",
            );
          },
        },
      );

    try {
      const response =
        await fetch(
          `${runtime.url}/api/executive/actions/action%3Atest/execute-mutation`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody(),
              ),
          },
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_action_mutation_not_enabled",
      );

      assert.equal(
        invoked,
        false,
      );
    } finally {
      await closeServer(
        runtime.server,
      );
    }
  },
);

test(
  "enabled route parses guarded replacement and delegates without executor selection",
  async () => {
    let received:
      unknown;

    const runtime =
      await createServer(
        true,
        {
          async dispatch(
            input:
              unknown,
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
                  "audit:completed:test",
              },

              executionResult: {
                ok:
                  true,

                summary:
                  "Replaced.",

                evidence:
                  [],

                metadata: {
                  compensationRequired:
                    true,

                  compensationSnapshot: {
                    encoding:
                      "base64",

                    content:
                      "YmVmb3Jl",

                    sha256:
                      SHA,

                    bytes:
                      6,
                  },

                  afterSha256:
                    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                },
              },
            };
          },
        },
      );

    try {
      const response =
        await fetch(
          `${runtime.url}/api/executive/actions/action%3Atest/execute-mutation`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...requestBody(),

                executorName:
                  "caller-must-not-select",
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
        body.compensation
          .required,
        true,
      );

      assert.equal(
        body.compensation
          .plan,
        "Restore exact prior bytes.",
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
              "filesystem.replace",

            path:
              "README.md",

            content:
              "replacement",

            expectedSha256:
              SHA,
          },
        },
      );
    } finally {
      await closeServer(
        runtime.server,
      );
    }
  },
);

test(
  "enabled route still fails closed when replace executor is not registered",
  async () => {
    const runtime =
      await createServer(
        true,
        {
          async dispatch() {
            throw new Error(
              "executive_action_executor_operation_not_registered",
            );
          },
        },
      );

    try {
      const response =
        await fetch(
          `${runtime.url}/api/executive/actions/action%3Atest/execute-mutation`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody(),
              ),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_action_executor_operation_not_registered",
      );
    } finally {
      await closeServer(
        runtime.server,
      );
    }
  },
);

test(
  "route refuses successful mutation result without compensation snapshot",
  async () => {
    const runtime =
      await createServer(
        true,
        {
          async dispatch() {
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
                  "Mutation",

                evidence:
                  [],

                metadata: {
                  afterSha256:
                    SHA,
                },
              },
            };
          },
        },
      );

    try {
      const response =
        await fetch(
          `${runtime.url}/api/executive/actions/action%3Atest/execute-mutation`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody(),
              ),
          },
        );

      assert.equal(
        response.status,
        500,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "executive_mutation_compensation_evidence_missing",
      );
    } finally {
      await closeServer(
        runtime.server,
      );
    }
  },
);

test(
  "post-mutation governed failure returns rollback material instead of generic error",
  async () => {
    const snapshot = {
      encoding:
        "base64",

      content:
        "YmVmb3Jl",

      sha256:
        SHA,

      bytes:
        6,
    };

    const afterSha256 =
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const runtime =
      await createServer(
        true,
        {
          async dispatch() {
            return {
              action: {
                status:
                  "failed",
              },

              delegation: {
                status:
                  "failed",
              },

              audit: {
                status:
                  "open",

                metadata: {
                  compensationStatus:
                    "required",
                },
              },

              executionResult: {
                ok:
                  false,

                reason:
                  "project_filesystem_replace_postcondition_failed",

                evidence:
                  [],

                compensationRequired:
                  true,

                compensationPlan:
                  "Restore exact prior bytes.",

                metadata: {
                  mutationCommitted:
                    true,

                  compensationRequired:
                    true,

                  compensationSnapshot:
                    snapshot,

                  afterSha256,
                },
              },
            };
          },
        },
      );

    try {
      const response =
        await fetch(
          `${runtime.url}/api/executive/actions/action%3Atest/execute-mutation`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody(),
              ),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "project_filesystem_replace_postcondition_failed",
      );

      assert.equal(
        body.action.status,
        "failed",
      );

      assert.equal(
        body.audit.metadata
          .compensationStatus,
        "required",
      );

      assert.equal(
        body.compensation
          .required,
        true,
      );

      assert.deepEqual(
        body.compensation
          .snapshot,
        snapshot,
      );

      assert.equal(
        body.compensation
          .afterSha256,
        afterSha256,
      );
    } finally {
      await closeServer(
        runtime.server,
      );
    }
  },
);
