import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import express from "express";

import type {
  AddressInfo,
} from "node:net";

import type {
  GenesisReplayScope,
  GenesisSourceManifestBuildResult,
  GenesisSourceManifestEntry,
} from "../../knowledge-preservation/genesis/index.js";

import {
  FileGenesisReplayPersistenceStore,
  createGenesisReplayPlan,
  createGenesisSourceManifestId,
  startGenesisReplayExecution,
} from "../../knowledge-preservation/genesis/index.js";

import {
  registerGenesisReplayInventoryRoute,
} from "../genesisReplayInventory.js";

function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    includedEvidenceTypes: [
      "commit",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "governance-v1",

    replayContractVersion:
      "1.0",
  };
}

function entry(
  id:
    string,
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      `genesis-source:commit:${id}`,

    sourceType:
      "commit",

    evidenceType:
      "commit",

    authorityClass:
      "repository-history",

    provenanceLocator:
      `git:commit:${id}`,

    sourceChecksum:
      `sha256:${id}`,

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      9000,

    discoveryMethod:
      "fixture",

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      subject:
        id,
    },
  };
}

function build(
  id:
    string,
): GenesisSourceManifestBuildResult {
  const replayScope =
    scope();

  const entries = [
    entry(
      id,
    ),
  ];

  const manifestId =
    createGenesisSourceManifestId({
      replayContractVersion:
        replayScope
          .replayContractVersion,

      scope:
        replayScope,

      entries,
    });

  return {
    manifest: {
      manifestId,

      replayContractVersion:
        replayScope
          .replayContractVersion,

      scope:
        replayScope,

      entries,

      discoveredAt:
        9000,
    },

    readiness:
      "READY",

    errors:
      [],

    observations:
      [],

    discovererIds: [
      "fixture",
    ],
  };
}

function persistence() {
  return new FileGenesisReplayPersistenceStore({
    storageRoot:
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-inventory-http-",
        ),
      ),
  });
}

function persistReplay(
  store:
    FileGenesisReplayPersistenceStore,

  id:
    string,
) {
  const manifestBuild =
    build(
      id,
    );

  const plan =
    createGenesisReplayPlan(
      manifestBuild,
    );

  const execution =
    startGenesisReplayExecution({
      plan,

      manifest:
        manifestBuild.manifest,

      startedAt:
        1000,
    });

  store.saveManifestBuild(
    manifestBuild,
  );

  store.saveExecution(
    execution,
  );

  return {
    manifestBuild,
    plan,
    execution,
  };
}

async function withServer<T>(
  store:
    FileGenesisReplayPersistenceStore,

  run:
    (
      baseUrl:
        string,
    ) => Promise<T>,
): Promise<T> {
  const app =
    express();

  app.use(
    express.json(),
  );

  registerGenesisReplayInventoryRoute(
    app,
    {
      persistence:
        store,

      manufacturingRuns: {
        list() {
          return [];
        },
      },
    },
  );

  const server =
    app.listen(
      0,
      "127.0.0.1",
    );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      server.once(
        "listening",
        resolve,
      );

      server.once(
        "error",
        reject,
      );
    },
  );

  const address =
    server.address() as
      AddressInfo;

  const baseUrl =
    `http://127.0.0.1:${address.port}`;

  try {
    return await run(
      baseUrl,
    );
  } finally {
    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        server.close(
          (
            error,
          ) => {
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
}

test(
  "live inventory HTTP endpoint returns successful empty inventory",
  async () => {
    const store =
      persistence();

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays`,
          );

        assert.equal(
          response.status,
          200,
        );

        assert.deepEqual(
          await response.json(),
          {
            ok:
              true,

            inventory: {
              total:
                0,

              replayIds:
                [],

              replays:
                [],
            },
          },
        );
      },
    );
  },
);

test(
  "live inventory HTTP endpoint preserves deterministic multi-replay ordering",
  async () => {
    const store =
      persistence();

    const first =
      persistReplay(
        store,
        "http-inventory-z",
      );

    const second =
      persistReplay(
        store,
        "http-inventory-a",
      );

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays`,
          );

        assert.equal(
          response.status,
          200,
        );

        const body =
          await response.json() as {
            ok:
              boolean;

            inventory: {
              total:
                number;

              replayIds:
                string[];

              replays:
                {
                  replayId:
                    string;
                }[];
            };
          };

        const expected =
          [
            first.plan.replayId,
            second.plan.replayId,
          ].sort();

        assert.equal(
          body.ok,
          true,
        );

        assert.equal(
          body.inventory.total,
          2,
        );

        assert.deepEqual(
          body.inventory.replayIds,
          expected,
        );

        assert.deepEqual(
          body.inventory.replays.map(
            (
              replay,
            ) =>
              replay.replayId,
          ),
          expected,
        );
      },
    );
  },
);

test(
  "live inventory HTTP endpoint exposes manifest-only replay without fabricating execution state",
  async () => {
    const store =
      persistence();

    const manifestBuild =
      build(
        "http-manifest-only",
      );

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    store.saveManifestBuild(
      manifestBuild,
    );

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays`,
          );

        assert.equal(
          response.status,
          200,
        );

        const body =
          await response.json() as {
            inventory: {
              replayIds:
                string[];

              replays:
                {
                  replayId:
                    string;

                  manifestPresent:
                    boolean;

                  executionPresent:
                    boolean;

                  recovery: {
                    eligible:
                      boolean;

                    reason:
                      string;
                  };
                }[];
            };
          };

        assert.deepEqual(
          body.inventory.replayIds,
          [
            plan.replayId,
          ],
        );

        assert.equal(
          body.inventory.replays[0]
            .replayId,
          plan.replayId,
        );

        assert.equal(
          body.inventory.replays[0]
            .manifestPresent,
          true,
        );

        assert.equal(
          body.inventory.replays[0]
            .executionPresent,
          false,
        );

        assert.deepEqual(
          body.inventory.replays[0]
            .recovery,
          {
            eligible:
              false,

            reason:
              "EXECUTION_NOT_FOUND",
          },
        );
      },
    );
  },
);

test(
  "live inventory HTTP endpoint fails closed on corrupt persisted replay without rewriting it",
  async () => {
    const store =
      persistence();

    const replay =
      persistReplay(
        store,
        "http-corrupt-inventory",
      );

    const executionFile =
      store.pathsFor(
        replay.plan.replayId,
      ).executionFile;

    writeFileSync(
      executionFile,
      '{"plan":',
      "utf8",
    );

    const before =
      readFileSync(
        executionFile,
        "utf8",
      );

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays`,
          );

        assert.equal(
          response.status,
          409,
        );

        assert.deepEqual(
          await response.json(),
          {
            ok:
              false,

            error:
              "genesis_replay_inventory_corrupt_json",
          },
        );
      },
    );

    assert.equal(
      readFileSync(
        executionFile,
        "utf8",
      ),
      before,
    );
  },
);
