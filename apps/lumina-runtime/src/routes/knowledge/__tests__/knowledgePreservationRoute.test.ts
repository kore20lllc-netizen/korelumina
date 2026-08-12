import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  createKnowledgePreservationPlatform,
} from "../../../knowledge-preservation/bootstrap/index.js";

import {
  registerKnowledgePreservationRoutes,
} from "../registerKnowledgePreservationRoutes.js";

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

async function startServer() {
  const preservationPlatform =
    createKnowledgePreservationPlatform();

  const app =
    express();

  app.use(
    express.json(),
  );

  registerKnowledgePreservationRoutes(
    app,
    {
      preservationPlatform,
    },
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

  return {
    server,
    preservationPlatform,
    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

test(
  "preserves approved document evidence into an awaiting-review package",
  async () => {
    const context =
      await startServer();

    try {
      const evidenceId =
        `evidence:route:${Date.now()}`;

      const response =
        await fetch(
          `${context.baseUrl}/api/knowledge/preserve`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  evidenceId,

                type:
                  "document",

                title:
                  "Approved KoreLumina Architecture Document",

                source:
                  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

                capturedAt:
                  100,

                observedAt:
                  90,

                contentRef:
                  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

                checksum:
                  "sha256:route-test",

                metadata: {
                  authorityClass:
                    "constitutional",

                  approvalState:
                    "approved",

                  owner:
                    "KoreLumina Architecture",

                  scope:
                    "platform",

                  version:
                    "1.0.0",

                  confidence:
                    1,
                },

                relationships: {},
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
        body.package.state,
        "awaiting_review",
      );

      assert.equal(
        body.package.items.length,
        1,
      );

      assert.deepEqual(
        context
          .preservationPlatform
          .canonicalKnowledgeStore
          .list(),
        [],
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "rejects malformed evidence",
  async () => {
    const context =
      await startServer();

    try {
      const response =
        await fetch(
          `${context.baseUrl}/api/knowledge/preserve`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                type:
                  "document",
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
        "knowledge_evidence_id_required",
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);

test(
  "preservation does not canonicalize automatically",
  async () => {
    const context =
      await startServer();

    try {
      const evidenceId =
        `evidence:no-auto:${Date.now()}`;

      const response =
        await fetch(
          `${context.baseUrl}/api/knowledge/preserve`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  evidenceId,

                type:
                  "document",

                title:
                  "Governed document",

                source:
                  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

                capturedAt:
                  100,

                observedAt:
                  90,

                contentRef:
                  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

                metadata: {
                  authorityClass:
                    "constitutional",

                  approvalState:
                    "approved",

                  confidence:
                    1,
                },

                relationships: {},
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      assert.deepEqual(
        context
          .preservationPlatform
          .canonicalKnowledgeStore
          .list(),
        [],
      );
    } finally {
      await closeServer(
        context.server,
      );
    }
  },
);
