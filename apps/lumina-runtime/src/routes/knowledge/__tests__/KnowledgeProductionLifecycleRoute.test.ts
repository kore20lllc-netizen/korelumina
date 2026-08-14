import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerKnowledgeProductionLifecycleRoutes,
} from "../registerKnowledgeProductionLifecycleRoutes.js";

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
  "production lifecycle exposes only governed real package-linked canonical and memory state",
  async () => {
    const app =
      express();

    registerKnowledgeProductionLifecycleRoutes(
      app,
      {
        packageService: {
          list:
            () => [
              {
                id:
                  "KP-2026-001",

                state:
                  "adapted",

                updatedAt:
                  20,
              },

              {
                id:
                  "KP-2026-002",

                state:
                  "awaiting_review",

                updatedAt:
                  10,
              },
            ],
        } as never,

        canonicalStore: {
          list:
            () => [
              {
                id:
                  "canonical:001",

                metadata: {
                  governance: {
                    packageId:
                      "KP-2026-001",
                  },
                },
              },

              {
                id:
                  "canonical:orphan",

                metadata: {
                  governance: {
                    packageId:
                      "KP-ORPHAN",
                  },
                },
              },
            ],
        } as never,

        memoryStore: {
          list:
            () => [
              {
                id:
                  "canonical-memory:001",

                governance: {
                  packageId:
                    "KP-2026-001",
                },
              },

              {
                id:
                  "canonical-memory:orphan",

                governance: {
                  packageId:
                    "KP-ORPHAN",
                },
              },
            ],
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
          `${baseUrl}/api/knowledge/production-lifecycle`,
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

      assert.deepEqual(
        body.packages.map(
          (
            item:
              {
                id:
                  string;
              },
          ) =>
            item.id,
        ),
        [
          "KP-2026-001",
          "KP-2026-002",
        ],
      );

      assert.deepEqual(
        body.canonicalItems.map(
          (
            item:
              {
                id:
                  string;
              },
          ) =>
            item.id,
        ),
        [
          "canonical:001",
        ],
      );

      assert.deepEqual(
        body.organizationalMemory.map(
          (
            item:
              {
                id:
                  string;
              },
          ) =>
            item.id,
        ),
        [
          "canonical-memory:001",
        ],
      );

      assert.deepEqual(
        body.summary,
        {
          packages:
            2,

          awaitingReview:
            1,

          approved:
            0,

          canonical:
            1,

          adapted:
            1,

          canonicalItems:
            1,

          organizationalMemory:
            1,
        },
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
