import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerCanonicalPromotionRoutes,
} from "../registerCanonicalPromotionRoutes.js";

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

async function post(
  baseUrl:
    string,

  packageId?:
    string,
) {
  return fetch(
    `${baseUrl}/api/knowledge/canonical-promotion`,
    {
      method:
        "POST",

      headers: {
        "content-type":
          "application/json",
      },

      body:
        JSON.stringify({
          packageId,
        }),
    },
  );
}

test(
  "approved package promotes through explicit canonical-promotion boundary",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let receivedPackageId:
      string |
      null =
      null;

    registerCanonicalPromotionRoutes(
      app,
      {
        promotionService: {
          promoteApprovedPackage:
            (
              packageId:
                string,
            ) => {
              receivedPackageId =
                packageId;

              return {
                knowledgePackage: {
                  id:
                    packageId,

                  state:
                    "canonical",
                },

                canonicalItems: [
                  {
                    id:
                      "canonical:item:1",

                    status:
                      "canonical",
                  },
                ],
              };
            },
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
        await post(
          baseUrl,
          "KP-2026-000000000201",
        );

      assert.equal(
        response.status,
        200,
      );

      const body =
        await response.json();

      assert.equal(
        receivedPackageId,
        "KP-2026-000000000201",
      );

      assert.equal(
        body.ok,
        true,
      );

      assert.equal(
        body.knowledgePackage.state,
        "canonical",
      );

      assert.equal(
        body.canonicalItems.length,
        1,
      );

      assert.equal(
        "organizationalMemoryRecords" in
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
    error,
  ] of [
    [
      "pending package cannot promote",
      "knowledge_package_not_approved",
    ],
    [
      "rejected package cannot promote",
      "knowledge_package_not_approved",
    ],
    [
      "remediation-required package cannot promote",
      "knowledge_package_not_approved",
    ],
    [
      "forged approved state without proof cannot promote",
      "governed_approval_proof_missing",
    ],
    [
      "approved package without immutable review history cannot promote",
      "governed_approval_history_missing",
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

      registerCanonicalPromotionRoutes(
        app,
        {
          promotionService: {
            promoteApprovedPackage:
              () => {
                throw new Error(
                  error,
                );
              },
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
          await post(
            baseUrl,
            "KP-2026-000000000202",
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

test(
  "unknown package returns not found",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    registerCanonicalPromotionRoutes(
      app,
      {
        promotionService: {
          promoteApprovedPackage:
            () => {
              throw new Error(
                "knowledge_package_not_found",
              );
            },
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
        await post(
          baseUrl,
          "KP-2026-unknown",
        );

      assert.equal(
        response.status,
        404,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "knowledge_package_not_found",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "missing package id is rejected before promotion service",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let called =
      false;

    registerCanonicalPromotionRoutes(
      app,
      {
        promotionService: {
          promoteApprovedPackage:
            () => {
              called =
                true;

              return {} as never;
            },
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
        await post(
          baseUrl,
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
        "knowledge_package_id_required",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
