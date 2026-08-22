import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import type {
  AutonomousGovernanceCycleInput,
  AutonomousGovernanceCycleResult,
} from "../../../knowledge-preservation/governance/index.js";

import {
  registerAutonomousGovernanceCycleRoutes,
} from "../registerAutonomousGovernanceCycleRoutes.js";

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
    object,
) {
  return fetch(
    `${baseUrl}/api/knowledge/governance/autonomous-cycle`,
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

function cycleResult(
  input:
    AutonomousGovernanceCycleInput,
):
  AutonomousGovernanceCycleResult {
  return {
    policyId:
      input.policyId,

    policyVersion:
      input.policyVersion,

    actorId:
      input.actorId,

    executedAt:
      input.executedAt ??
      3000,

    discovered:
      3,

    binding: {
      attempted:
        2,

      bound:
        1,

      alreadyBound:
        1,

      notApplicable:
        1,

      exceptions:
        0,

      packages: [
        {
          packageId:
            "KP-1",

          packageVersion:
            "1.0.0",

          disposition:
            "bound",
        },

        {
          packageId:
            "KP-2",

          packageVersion:
            "1.0.0",

          disposition:
            "already_bound",
        },

        {
          packageId:
            "KP-3",

          packageVersion:
            "1.0.0",

          disposition:
            "not_applicable",

          reason:
            "policy_authority_or_scope_mismatch",
        },
      ],
    },

    review: {
      policy: {
        id:
          input.policyId,

        version:
          input.policyVersion,

        status:
          "active",
      },

      executedBy:
        input.actorId,

      executedAt:
        input.executedAt ??
        3000,

      eligiblePackages:
        2,

      compliantPackages:
        2,

      exceptions:
        0,

      blocked:
        0,

      decisions: [
        {
          packageId:
            "KP-1",

          decision:
            "approved",

          review: {
            reviewerId:
              "human:founder",
          },
        },

        {
          packageId:
            "KP-2",

          decision:
            "approved",

          review: {
            reviewerId:
              "human:founder",
          },
        },
      ],

      evaluations:
        [],

      promotion:
        null,
    },

    promotion: {
      executionId:
        "autonomous-promotion:test",

      policyId:
        input.policyId,

      policyVersion:
        input.policyVersion,

      actorId:
        input.actorId,

      executedAt:
        input.executedAt ??
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
            "KP-1",

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
            "canonical:1",
          ],
        },

        {
          packageId:
            "KP-2",

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
            "canonical:2",
          ],
        },
      ],
    },
  };
}

test(
  "route delegates exact policy authority and mechanical actor to orchestrator",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let received:
      AutonomousGovernanceCycleInput |
      null =
      null;

    registerAutonomousGovernanceCycleRoutes(
      app,
      {
        orchestrator: {
          execute(
            input,
          ) {
            received =
              input;

            return cycleResult(
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
              "korelumina-vision-2050-architecture",

            policyVersion:
              "1.0.0",

            actorId:
              "runtime:autonomous-governance",

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
          policyId:
            "korelumina-vision-2050-architecture",

          policyVersion:
            "1.0.0",

          actorId:
            "runtime:autonomous-governance",

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
        body.discovered,
        3,
      );

      assert.equal(
        body.binding.bound,
        1,
      );

      assert.equal(
        body.binding.alreadyBound,
        1,
      );

      assert.equal(
        body.review.compliantPackages,
        2,
      );

      assert.equal(
        body.review.decisions.length,
        2,
      );

      assert.equal(
        body.promotion.promoted,
        1,
      );

      assert.equal(
        body.promotion.alreadyCanonical,
        1,
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
    expectedError,
  ]
  of [
    [
      "policy id required",
      {
        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",
      },
      "autonomous_governance_cycle_policy_id_required",
    ],

    [
      "policy version required",
      {
        policyId:
          "korelumina-vision-2050-architecture",

        actorId:
          "runtime:autonomous-governance",
      },
      "autonomous_governance_cycle_policy_version_required",
    ],

    [
      "actor id required",
      {
        policyId:
          "korelumina-vision-2050-architecture",

        policyVersion:
          "1.0.0",
      },
      "autonomous_governance_cycle_actor_id_required",
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

      registerAutonomousGovernanceCycleRoutes(
        app,
        {
          orchestrator: {
            execute() {
              called =
                true;

              throw new Error(
                "must_not_execute",
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

        const payload =
          await response.json();

        assert.equal(
          payload.ok,
          false,
        );

        assert.equal(
          payload.error,
          expectedError,
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
  "unknown policy maps to not found",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerAutonomousGovernanceCycleRoutes(
      app,
      {
        orchestrator: {
          execute() {
            throw new Error(
              "autonomous_governance_cycle_policy_not_found:POLICY-X@1.0.0",
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
              "1.0.0",

            actorId:
              "runtime:test",
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
        "autonomous_governance_cycle_policy_not_found:POLICY-X@1.0.0",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "inactive policy maps to conflict",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerAutonomousGovernanceCycleRoutes(
      app,
      {
        orchestrator: {
          execute() {
            throw new Error(
              "autonomous_governance_cycle_policy_not_active:revoked",
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
              "1.0.0",

            actorId:
              "runtime:test",
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
        "autonomous_governance_cycle_policy_not_active:revoked",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "route returns orchestrator exception details without secondary behavior",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    const input:
      AutonomousGovernanceCycleInput = {
      policyId:
        "POLICY-EXCEPTION",

      policyVersion:
        "1.0.0",

      actorId:
        "runtime:test",
    };

    const base =
      cycleResult(
        input,
      );

    registerAutonomousGovernanceCycleRoutes(
      app,
      {
        orchestrator: {
          execute() {
            return {
              ...base,

              binding: {
                attempted:
                  1,

                bound:
                  0,

                alreadyBound:
                  0,

                notApplicable:
                  0,

                exceptions:
                  1,

                packages: [
                  {
                    packageId:
                      "KP-FAIL",

                    packageVersion:
                      "1.0.0",

                    disposition:
                      "exception",

                    reason:
                      "canonical_review_policy_binding_validation_not_passed",
                  },
                ],
              },
            };
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
          input,
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.binding.exceptions,
        1,
      );

      assert.equal(
        body.binding.packages[0]
          .disposition,
        "exception",
      );

      assert.equal(
        body.binding.packages[0]
          .reason,
        "canonical_review_policy_binding_validation_not_passed",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
