import assert from "node:assert/strict";
import type { Server } from "node:http";
import test from "node:test";

import express from "express";

import {
  registerLegacyHistoricalReconciliationRoutes,
} from "../registerLegacyHistoricalReconciliationRoutes.js";

async function listen(
  app: ReturnType<typeof express>,
): Promise<{
  server: Server;
  baseUrl: string;
}> {
  const server =
    app.listen(0);

  await new Promise<void>(
    resolve => {
      server.once(
        "listening",
        resolve,
      );
    },
  );

  const address =
    server.address();

  assert.ok(
    address &&
    typeof address !==
      "string",
  );

  return {
    server,
    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

async function close(
  server: Server,
): Promise<void> {
  await new Promise<void>(
    (resolve, reject) => {
      server.close(
        error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    },
  );
}

async function post(
  baseUrl: string,
  body: object,
) {
  return fetch(
    `${baseUrl}/api/knowledge/governance/legacy-historical-reconciliation`,
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",
      },

      body:
        JSON.stringify(body),
    },
  );
}

test(
  "route delegates one explicit package to orchestrator",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let received:
      unknown =
      null;

    registerLegacyHistoricalReconciliationRoutes(
      app,
      {
        orchestrator: {
          executeOne(input) {
            received =
              input;

            return {
              packageId:
                input.packageId,

              disposition:
                "reconciled",

              replayId:
                "genesis-replay:test",

              evidenceId:
                "genesis-evidence:test",

              historicalSourceId:
                "genesis-source:commit:test",

              sourceReferenceId:
                "genesis-source-ref:test",

              sourceRevisionId:
                "genesis-source-revision:test",

              eventId:
                "genesis-event:test",

              sourceChecksum:
                "sha256:test",
            };
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(app);

    try {
      const response =
        await post(
          baseUrl,
          {
            packageId:
              "KP-2026-000009",

            actorId:
              "human:founder",

            executedAt:
              5000,
          },
        );

      assert.equal(
        response.status,
        200,
      );

      assert.deepEqual(
        received,
        {
          packageId:
            "KP-2026-000009",

          actorId:
            "human:founder",

          executedAt:
            5000,
        },
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.disposition,
        "reconciled",
      );
    } finally {
      await close(server);
    }
  },
);

test(
  "route exposes already reconciled idempotently",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerLegacyHistoricalReconciliationRoutes(
      app,
      {
        orchestrator: {
          executeOne(input) {
            return {
              packageId:
                input.packageId,

              disposition:
                "already_reconciled",
            };
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(app);

    try {
      const response =
        await post(
          baseUrl,
          {
            packageId:
              "KP-2026-000009",

            actorId:
              "human:founder",
          },
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
        body.disposition,
        "already_reconciled",
      );
    } finally {
      await close(server);
    }
  },
);

test(
  "route maps reconciliation exception to conflict",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerLegacyHistoricalReconciliationRoutes(
      app,
      {
        orchestrator: {
          executeOne(input) {
            return {
              packageId:
                input.packageId,

              disposition:
                "exception",

              reason:
                "verified_genesis_historical_correlation_state_not_found",
            };
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(app);

    try {
      const response =
        await post(
          baseUrl,
          {
            packageId:
              "KP-2026-000009",

            actorId:
              "human:founder",
          },
        );

      assert.equal(
        response.status,
        409,
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        false,
      );

      assert.equal(
        body.disposition,
        "exception",
      );
    } finally {
      await close(server);
    }
  },
);

for (
  const [
    name,
    body,
    expectedError,
  ]
  of [
    [
      "package id is required",
      {
        actorId:
          "human:founder",
      },
      "legacy_historical_reconciliation_package_id_required",
    ],
    [
      "actor id is required",
      {
        packageId:
          "KP-2026-000009",
      },
      "legacy_historical_reconciliation_actor_id_required",
    ],
  ] as const
) {
  test(
    name,
    async () => {
      const app =
        express();

      app.use(
        express.json(),
      );

      let called =
        false;

      registerLegacyHistoricalReconciliationRoutes(
        app,
        {
          orchestrator: {
            executeOne() {
              called =
                true;

              return {
                packageId:
                  "must-not-run",

                disposition:
                  "exception",
              };
            },
          },
        },
      );

      const {
        server,
        baseUrl,
      } =
        await listen(app);

      try {
        const response =
          await post(
            baseUrl,
            body,
          );

        assert.equal(
          response.status,
          400,
        );

        const payload =
          await response.json();

        assert.equal(
          payload.error,
          expectedError,
        );

        assert.equal(
          called,
          false,
        );
      } finally {
        await close(server);
      }
    },
  );
}
