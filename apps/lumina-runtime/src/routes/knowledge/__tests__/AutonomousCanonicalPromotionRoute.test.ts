import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import type {
  AutonomousGovernedCanonicalPromotionInput,
  AutonomousGovernedCanonicalPromotionResult,
} from "../../../knowledge-preservation/promotion/index.js";

import {
  registerAutonomousCanonicalPromotionRoutes,
} from "../registerAutonomousCanonicalPromotionRoutes.js";

async function listen(
  app:
    ReturnType<
      typeof express
    >,
): Promise<{
  server:
    Server;

  baseUrl:
    string;
}> {
  const server =
    app.listen(
      0,
    );

  await new Promise<void>(
    (resolve) => {
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
  server:
    Server,
): Promise<void> {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      server.close(
        (error) => {
          if (error) {
            reject(
              error,
            );

            return;
          }

          resolve();
        },
      );
    },
  );
}

async function post(
  baseUrl:
    string,

  body:
    Record<
      string,
      unknown
    >,
) {
  return fetch(
    `${baseUrl}/api/knowledge/canonical-promotion/autonomous`,
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",
      },

      body:
        JSON.stringify(
          body,
        ),
    },
  );
}

function result(
  input:
    AutonomousGovernedCanonicalPromotionInput,
):
  AutonomousGovernedCanonicalPromotionResult {
  return {
    executionId:
      "autonomous-promotion:test",

    policyId:
      input.policyId,

    policyVersion:
      input.policyVersion,

    actorId:
      input.actorId,

    executedAt:
      3000,

    eligible:
      2,

    promoted:
      1,

    alreadyCanonical:
      1,

    failed:
      0,

    exceptions:
      0,

    packages: [
      {
        packageId:
          "KP-TEST-001",

        packageVersion:
          "1.0.0",

        policyId:
          input.policyId,

        policyVersion:
          input.policyVersion,

        actorId:
          input.actorId,

        disposition:
          "promoted",

        canonicalKnowledgeIds: [
          "canonical:test:1",
        ],
      },
      {
        packageId:
          "KP-TEST-002",

        packageVersion:
          "1.0.0",

        policyId:
          input.policyId,

        policyVersion:
          input.policyVersion,

        actorId:
          input.actorId,

        disposition:
          "already_canonical",

        canonicalKnowledgeIds: [
          "canonical:test:2",
        ],
      },
    ],
  };
}

test(
  "autonomous route passes exact policy authority to executor and returns exact execution result",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let received:
      AutonomousGovernedCanonicalPromotionInput |
      null =
      null;

    registerAutonomousCanonicalPromotionRoutes(
      app,
      {
        executor: {
          execute(
            input,
          ) {
            received =
              input;

            return result(
              input,
            );
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(
        app,
      );

    try {
      const response =
        await post(
          baseUrl,
          {
            policyId:
              "POLICY-2050",

            policyVersion:
              "1.0.0",

            actorId:
              "runtime:autonomous-promotion",
          },
        );

      assert.equal(
        response.status,
        200,
      );

      assert.deepEqual(
        received,
        {
          policyId:
            "POLICY-2050",

          policyVersion:
            "1.0.0",

          actorId:
            "runtime:autonomous-promotion",
        },
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.executionId,
        "autonomous-promotion:test",
      );

      assert.equal(
        body.eligible,
        2,
      );

      assert.equal(
        body.promoted,
        1,
      );

      assert.equal(
        body.alreadyCanonical,
        1,
      );

      assert.equal(
        body.packages.length,
        2,
      );

      assert.equal(
        "organizationalMemoryRecords" in
          body,
        false,
      );

      assert.equal(
        "educationalAdmission" in
          body,
        false,
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

for (
  const [
    name,
    body,
    error,
  ] of [
    [
      "policy id is required",
      {
        policyVersion:
          "1.0.0",
        actorId:
          "runtime",
      },
      "autonomous_canonical_promotion_policy_id_required",
    ],
    [
      "policy version is required",
      {
        policyId:
          "POLICY-2050",
        actorId:
          "runtime",
      },
      "autonomous_canonical_promotion_policy_version_required",
    ],
    [
      "actor id is required",
      {
        policyId:
          "POLICY-2050",
        policyVersion:
          "1.0.0",
      },
      "autonomous_canonical_promotion_actor_id_required",
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

      registerAutonomousCanonicalPromotionRoutes(
        app,
        {
          executor: {
            execute() {
              called =
                true;

              throw new Error(
                "should_not_execute",
              );
            },
          },
        },
      );

      const {
        server,
        baseUrl,
      } =
        await listen(
          app,
        );

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

        const responseBody =
          await response.json();

        assert.equal(
          responseBody.ok,
          false,
        );

        assert.equal(
          responseBody.error,
          error,
        );

        assert.equal(
          called,
          false,
        );
      } finally {
        await close(
          server,
        );
      }
    },
  );
}

test(
  "unknown exact policy authority returns not found",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerAutonomousCanonicalPromotionRoutes(
      app,
      {
        executor: {
          execute() {
            throw new Error(
              "autonomous_canonical_promotion_policy_not_found:POLICY-X@9.0.0",
            );
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(
        app,
      );

    try {
      const response =
        await post(
          baseUrl,
          {
            policyId:
              "POLICY-X",

            policyVersion:
              "9.0.0",

            actorId:
              "runtime",
          },
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        false,
      );

      assert.equal(
        body.error,
        "autonomous_canonical_promotion_policy_not_found:POLICY-X@9.0.0",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "inactive policy authority returns conflict",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerAutonomousCanonicalPromotionRoutes(
      app,
      {
        executor: {
          execute() {
            throw new Error(
              "autonomous_canonical_promotion_policy_not_active:superseded",
            );
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(
        app,
      );

    try {
      const response =
        await post(
          baseUrl,
          {
            policyId:
              "POLICY-OLD",

            policyVersion:
              "1.0.0",

            actorId:
              "runtime",
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
        body.error,
        "autonomous_canonical_promotion_policy_not_active:superseded",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "executor failure is exposed without invoking any secondary lifecycle",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerAutonomousCanonicalPromotionRoutes(
      app,
      {
        executor: {
          execute() {
            throw new Error(
              "autonomous_execution_failed",
            );
          },
        },
      },
    );

    const {
      server,
      baseUrl,
    } =
      await listen(
        app,
      );

    try {
      const response =
        await post(
          baseUrl,
          {
            policyId:
              "POLICY-2050",

            policyVersion:
              "1.0.0",

            actorId:
              "runtime",
          },
        );

      assert.equal(
        response.status,
        400,
      );

      const body =
        await response.json();

      assert.equal(
        body.ok,
        false,
      );

      assert.equal(
        body.error,
        "autonomous_execution_failed",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
