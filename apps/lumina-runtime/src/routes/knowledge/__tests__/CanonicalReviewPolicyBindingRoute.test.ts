import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import type {
  BindCanonicalReviewPolicyInput,
} from "../../../knowledge-preservation/review/index.js";

import {
  registerCanonicalReviewPolicyBindingRoutes,
} from "../registerCanonicalReviewPolicyBindingRoutes.js";

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

  packageId:
    string,

  body:
    Record<
      string,
      unknown
    >,
) {
  return fetch(
    `${baseUrl}/api/knowledge/canonical-review/packages/${encodeURIComponent(packageId)}/policy-binding`,
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

test(
  "route delegates exact package and policy authority without review or promotion",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let received:
      BindCanonicalReviewPolicyInput |
      null =
      null;

    registerCanonicalReviewPolicyBindingRoutes(
      app,
      {
        service: {
          bind(
            input,
          ) {
            received =
              input;

            return {
              knowledgePackage: {
                id:
                  input.packageId,

                state:
                  "awaiting_review",

                approvalState:
                  "pending_review",
              },

              binding: {
                policyId:
                  input.policyId,

                policyVersion:
                  input.policyVersion,

                authorizedBy:
                  "human:founder",

                authorizedAt:
                  1000,

                boundBy:
                  input.boundBy,

                boundAt:
                  input.boundAt ??
                  2000,
              },

              classification: {
                packageId:
                  input.packageId,

                risk:
                  "low",

                mode:
                  "policy_candidate",

                reasons: [
                  "test",
                ],

                policyId:
                  input.policyId,
              },

              disposition:
                "bound",
            } as never;
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
          "KP-PHASE40-001",
          {
            policyId:
              "VISION-2050-ARCHITECTURE",

            policyVersion:
              "1.0.0",

            boundBy:
              "runtime:policy-binding",

            boundAt:
              2000,
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
            "KP-PHASE40-001",

          policyId:
            "VISION-2050-ARCHITECTURE",

          policyVersion:
            "1.0.0",

          boundBy:
            "runtime:policy-binding",

          boundAt:
            2000,
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
        "bound",
      );

      assert.equal(
        body.classification.mode,
        "policy_candidate",
      );

      assert.equal(
        body.knowledgePackage.state,
        "awaiting_review",
      );

      assert.equal(
        body.knowledgePackage.approvalState,
        "pending_review",
      );

      assert.equal(
        body.reviewDecision,
        null,
      );

      assert.equal(
        body.promotion,
        null,
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "already-bound result remains idempotent through route",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerCanonicalReviewPolicyBindingRoutes(
      app,
      {
        service: {
          bind(
            input,
          ) {
            return {
              knowledgePackage: {
                id:
                  input.packageId,

                state:
                  "awaiting_review",

                approvalState:
                  "pending_review",
              },

              binding: {
                policyId:
                  input.policyId,

                policyVersion:
                  input.policyVersion,

                authorizedBy:
                  "human:founder",

                authorizedAt:
                  1000,

                boundBy:
                  "runtime:first-binding",

                boundAt:
                  1500,
              },

              classification: {
                packageId:
                  input.packageId,

                risk:
                  "low",

                mode:
                  "policy_candidate",

                reasons:
                  [],

                policyId:
                  input.policyId,
              },

              disposition:
                "already_bound",
            } as never;
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
          "KP-PHASE40-002",
          {
            policyId:
              "VISION-2050-ARCHITECTURE",

            policyVersion:
              "1.0.0",

            boundBy:
              "runtime:second-binding",
          },
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        body.disposition,
        "already_bound",
      );

      assert.equal(
        body.reviewDecision,
        null,
      );

      assert.equal(
        body.promotion,
        null,
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
    expected,
  ]
  of [
    [
      "policy id required",
      {
        policyVersion:
          "1.0.0",

        boundBy:
          "runtime:test",
      },
      "canonical_review_policy_binding_policy_id_required",
    ],

    [
      "policy version required",
      {
        policyId:
          "VISION-2050",

        boundBy:
          "runtime:test",
      },
      "canonical_review_policy_binding_policy_version_required",
    ],

    [
      "actor required",
      {
        policyId:
          "VISION-2050",

        policyVersion:
          "1.0.0",
      },
      "canonical_review_policy_binding_actor_id_required",
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

      registerCanonicalReviewPolicyBindingRoutes(
        app,
        {
          service: {
            bind() {
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
            "KP-PHASE40-003",
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
          expected,
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

for (
  const [
    error,
    status,
  ]
  of [
    [
      "knowledge_package_not_found",
      404,
    ],

    [
      "canonical_review_policy_binding_policy_not_found:VISION-2050@1.0.0",
      404,
    ],

    [
      "canonical_review_policy_binding_policy_not_active:draft",
      409,
    ],

    [
      "canonical_review_policy_binding_conflict:OLD@1.0.0",
      409,
    ],

    [
      "canonical_review_policy_binding_package_not_awaiting_review",
      409,
    ],

    [
      "canonical_review_policy_binding_constitutional_authority_requires_individual_review",
      409,
    ],

    [
      "canonical_review_policy_binding_governance_identity_incomplete",
      409,
    ],

    [
      "canonical_review_policy_binding_provenance_incomplete",
      409,
    ],

    [
      "canonical_review_policy_binding_validation_not_passed",
      409,
    ],

    [
      "canonical_review_policy_binding_authority_mismatch",
      409,
    ],

    [
      "canonical_review_policy_binding_scope_mismatch",
      409,
    ],

    [
      "canonical_review_policy_binding_authority_excluded",
      409,
    ],
  ] as const
) {
  test(
    `${error} maps to ${status}`,
    async () => {
      const app =
        express();

      app.use(
        express.json(),
      );

      registerCanonicalReviewPolicyBindingRoutes(
        app,
        {
          service: {
            bind() {
              throw new Error(
                error,
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
            "KP-PHASE40-004",
            {
              policyId:
                "VISION-2050",

              policyVersion:
                "1.0.0",

              boundBy:
                "runtime:test",
            },
          );

        assert.equal(
          response.status,
          status,
        );

        const payload =
          await response.json();

        assert.equal(
          payload.ok,
          false,
        );

        assert.equal(
          payload.error,
          error,
        );
      } finally {
        await close(
          server,
        );
      }
    },
  );
}
