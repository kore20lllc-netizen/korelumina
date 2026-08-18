import assert from "node:assert/strict";
import type {
  Server,
} from "node:http";
import test from "node:test";

import express from "express";

import {
  registerOrganizationalMemoryAdaptationRoutes,
} from "../registerOrganizationalMemoryAdaptationRoutes.js";

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

function canonicalPackage() {
  return {
    id:
      "KP-2026-000000000501",

    state:
      "canonical",

    metadata: {
      canonicalization: {
        canonicalItemIds: [
          "canonical:item:501",
        ],
      },
    },
  };
}

test(
  "canonical package adapts through explicit governed memory boundary",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let receivedItems:
      unknown[] =
      [];

    registerOrganizationalMemoryAdaptationRoutes(
      app,
      {
        packageService: {
          get:
            () =>
              canonicalPackage(),

          markAdapted:
            (
              id:
                string,
              recordIds:
                readonly string[],
            ) => ({
              ...canonicalPackage(),

              id,

              state:
                "adapted",

              metadata: {
                ...canonicalPackage()
                  .metadata,

                organizationalMemoryAdaptation: {
                  recordIds: [
                    ...recordIds,
                  ],
                },
              },
            }),
        } as never,

        canonicalStore: {
          get:
            (
              id:
                string,
            ) => ({
              id,
              status:
                "canonical",
            }),
        } as never,

        adaptationService: {
          adaptAndPersist:
            (
              input:
                {
                  items:
                    unknown[];
                },
            ) => {
              receivedItems =
                input.items;

              return {
                records: [
                  {
                    id:
                      "canonical-memory:canonical:item:501",

                    governance: {
                      trust: {
                        adaptationValidated:
                          true,
                      },
                    },
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
        await fetch(
          `${baseUrl}/api/knowledge/organizational-memory-adaptation`,
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
                  "KP-2026-000000000501",

                organizationId:
                  "organization:korelumina",

                projectId:
                  "project:korelumina",

                generalization: {
                  generalized:
                    true,

                  customerSpecificContentRetained:
                    false,
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
        body.ok,
        true,
      );

      assert.equal(
        body.packageId,
        "KP-2026-000000000501",
      );

      assert.equal(
        body.packageState,
        "adapted",
      );

      assert.equal(
        body.records.length,
        1,
      );

      assert.equal(
        receivedItems.length,
        1,
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "team workspace scope supplies organizational identity when explicit organization is absent",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let receivedOrganizationId =
      "";

    let receivedTeamId:
      string |
      undefined;

    registerOrganizationalMemoryAdaptationRoutes(
      app,
      {
        packageService: {
          get:
            () =>
              canonicalPackage(),

          markAdapted:
            (
              id:
                string,
            ) => ({
              ...canonicalPackage(),
              id,
              state:
                "adapted",
            }),
        } as never,

        canonicalStore: {
          get:
            (
              id:
                string,
            ) => ({
              id,
              status:
                "canonical",
            }),
        } as never,

        adaptationService: {
          adaptAndPersist:
            (
              input:
                {
                  organizationId:
                    string;

                  teamId?:
                    string;
                },
            ) => {
              receivedOrganizationId =
                input.organizationId;

              receivedTeamId =
                input.teamId;

              return {
                records: [
                  {
                    id:
                      "canonical-memory:workspace-scope",
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
        await fetch(
          `${baseUrl}/api/knowledge/organizational-memory-adaptation`,
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
                  "KP-2026-000000000501",

                teamId:
                  "team:workspace-001",

                generalization: {
                  generalized:
                    true,

                  customerSpecificContentRetained:
                    false,
                },
              }),
          },
        );

      assert.equal(
        response.status,
        200,
      );

      assert.equal(
        receivedOrganizationId,
        "team:workspace-001",
      );

      assert.equal(
        receivedTeamId,
        "team:workspace-001",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "non-canonical package cannot enter organizational memory",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let adaptationCalled =
      false;

    registerOrganizationalMemoryAdaptationRoutes(
      app,
      {
        packageService: {
          get:
            () => ({
              ...canonicalPackage(),

              state:
                "approved",
            }),
        } as never,

        canonicalStore:
          {} as never,

        adaptationService: {
          adaptAndPersist:
            () => {
              adaptationCalled =
                true;

              return {
                records:
                  [],
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
        await fetch(
          `${baseUrl}/api/knowledge/organizational-memory-adaptation`,
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
                  "KP-2026-000000000501",

                organizationId:
                  "organization:korelumina",

                generalization: {
                  generalized:
                    true,

                  customerSpecificContentRetained:
                    false,
                },
              }),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      assert.equal(
        adaptationCalled,
        false,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "knowledge_package_not_canonical",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "generalization declaration is mandatory",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let packageLookup =
      false;

    registerOrganizationalMemoryAdaptationRoutes(
      app,
      {
        packageService: {
          get:
            () => {
              packageLookup =
                true;

              return canonicalPackage();
            },
        } as never,

        canonicalStore:
          {} as never,

        adaptationService:
          {} as never,
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
          `${baseUrl}/api/knowledge/organizational-memory-adaptation`,
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
                  "KP-2026-000000000501",

                organizationId:
                  "organization:korelumina",
              }),
          },
        );

      assert.equal(
        response.status,
        400,
      );

      assert.equal(
        packageLookup,
        false,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "organizational_memory_generalization_declaration_required",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);

test(
  "missing canonical item cannot be adapted",
  async () => {
    const app =
      express();

    app.use(
      express.json(),
    );

    let adaptationCalled =
      false;

    registerOrganizationalMemoryAdaptationRoutes(
      app,
      {
        packageService: {
          get:
            () =>
              canonicalPackage(),
        } as never,

        canonicalStore: {
          get:
            () =>
              undefined,
        } as never,

        adaptationService: {
          adaptAndPersist:
            () => {
              adaptationCalled =
                true;

              return {
                records:
                  [],
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
        await fetch(
          `${baseUrl}/api/knowledge/organizational-memory-adaptation`,
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
                  "KP-2026-000000000501",

                organizationId:
                  "organization:korelumina",

                generalization: {
                  generalized:
                    true,

                  customerSpecificContentRetained:
                    false,
                },
              }),
          },
        );

      assert.equal(
        response.status,
        409,
      );

      assert.equal(
        adaptationCalled,
        false,
      );

      const body =
        await response.json();

      assert.equal(
        body.error,
        "canonical_item_not_available",
      );
    } finally {
      await close(
        server,
      );
    }
  },
);
