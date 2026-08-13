import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerCanonicalReviewRoutes,
} from "../registerCanonicalReviewRoutes.js";

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
          if (
            error
          ) {
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

test(
  "GET exposes persisted canonical-review states truthfully",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerCanonicalReviewRoutes(
      app,
      {
        reviewService:
          {} as never,

        packageService: {
          list:
            () => [
              {
                id:
                  "KP-2026-000000000001",

                state:
                  "awaiting_review",

                approvalState:
                  "pending_review",

                updatedAt:
                  400,
              },

              {
                id:
                  "KP-2026-000000000002",

                state:
                  "approved",

                approvalState:
                  "approved",

                updatedAt:
                  300,
              },

              {
                id:
                  "KP-2026-000000000003",

                state:
                  "rejected",

                approvalState:
                  "rejected",

                updatedAt:
                  200,
              },

              {
                id:
                  "KP-2026-000000000004",

                state:
                  "validated",

                approvalState:
                  "remediation_required",

                updatedAt:
                  100,
              },

              {
                id:
                  "KP-2026-000000000005",

                state:
                  "captured",

                approvalState:
                  "pending_review",

                updatedAt:
                  50,
              },
            ] as never,
        } as never,
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
        await fetch(
          `${baseUrl}/api/knowledge/canonical-review`,
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
        body.summary.total,
        4,
      );

      assert.equal(
        body.summary.pending,
        1,
      );

      assert.equal(
        body.summary.approved,
        1,
      );

      assert.equal(
        body.summary.rejected,
        1,
      );

      assert.equal(
        body.summary.remediationRequired,
        1,
      );

      assert.deepEqual(
        body.packages.map(
          (
            item:
              {
                reviewStatus:
                  string;
              },
          ) =>
            item.reviewStatus,
        ),
        [
          "pending",
          "approved",
          "rejected",
          "remediation_required",
        ],
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "approved review records governance decision without invoking canonical promotion",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let reviewInvocations =
      0;

    registerCanonicalReviewRoutes(
      app,
      {
        reviewService: {
          review:
            (
              input:
                Record<
                  string,
                  unknown
                >,
            ) => {
              reviewInvocations +=
                1;

              return {
                decision:
                  input.decision,

                review: {
                  packageId:
                    input.packageId,

                  reviewerId:
                    input.reviewerId,
                },

                knowledgePackage: {
                  id:
                    input.packageId,

                  state:
                    "approved",

                  approvalState:
                    "approved",
                },
              };
            },
        } as never,

        packageService: {
          list:
            () => [],
        } as never,
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
        await fetch(
          `${baseUrl}/api/knowledge/canonical-review`,
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                packageId:
                  "KP-2026-000000000143",

                decision:
                  "approved",

                reviewerId:
                  "reviewer:architecture",

                evidenceConsidered: [
                  "evidence:143",
                ],

                reason:
                  "Governed approval.",
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
        reviewInvocations,
        1,
      );

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.review.decision,
        "approved",
      );

      assert.equal(
        body.promotion,
        null,
      );

      assert.equal(
        "canonicalItems" in
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

test(
  "remediation-required is an explicit supported review decision",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let receivedDecision:
      string |
      null =
      null;

    registerCanonicalReviewRoutes(
      app,
      {
        reviewService: {
          review:
            (
              input:
                {
                  decision:
                    string;
                },
            ) => {
              receivedDecision =
                input.decision;

              return {
                decision:
                  input.decision,

                knowledgePackage: {
                  state:
                    "validated",

                  approvalState:
                    "remediation_required",
                },
              };
            },
        } as never,

        packageService: {
          list:
            () => [],
        } as never,
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
        await fetch(
          `${baseUrl}/api/knowledge/canonical-review`,
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                packageId:
                  "KP-2026-000000000144",

                decision:
                  "remediation_required",

                reviewerId:
                  "reviewer:architecture",
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      assert.equal(
        receivedDecision,
        "remediation_required",
      );

      const body =
        await response.json();

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
  "invalid review decision is rejected before review service",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let called =
      false;

    registerCanonicalReviewRoutes(
      app,
      {
        reviewService: {
          review:
            () => {
              called =
                true;

              return {};
            },
        } as never,

        packageService: {
          list:
            () => [],
        } as never,
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
        await fetch(
          `${baseUrl}/api/knowledge/canonical-review`,
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                packageId:
                  "KP-2026-000000000145",

                decision:
                  "canonical",

                reviewerId:
                  "reviewer:architecture",
              }),
          },
        );

      assert.equal(
        response.status,
        400,
      );

      assert.equal(
        called,
        false,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "canonical_review_decision_invalid",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
