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
  registerGenesisReplayStatusRoute,
} from "../genesisReplayStatus.js";

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
  entries:
    readonly GenesisSourceManifestEntry[],
): GenesisSourceManifestBuildResult {
  const replayScope =
    scope();

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
          "korelumina-genesis-http-integration-",
        ),
      ),
  });
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

  registerGenesisReplayStatusRoute(
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
  "live HTTP route rejects malformed Replay Identity before persistence lookup",
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
            `${baseUrl}/api/runtime/genesis/replays/not-a-replay/status`,
          );

        assert.equal(
          response.status,
          400,
        );

        assert.deepEqual(
          await response.json(),
          {
            ok:
              false,

            error:
              "genesis_replay_id_invalid",
          },
        );
      },
    );
  },
);

test(
  "live HTTP route returns not-found for valid deterministic Replay Identity absent from storage",
  async () => {
    const store =
      persistence();

    const replayId =
      `genesis-replay:${"a".repeat(
        64,
      )}`;

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays/${replayId}/status`,
          );

        assert.equal(
          response.status,
          404,
        );

        const body =
          await response.json() as {
            ok:
              boolean;

            error:
              string;

            replayId:
              string;
          };

        assert.equal(
          body.ok,
          false,
        );

        assert.equal(
          body.error,
          "genesis_replay_not_found",
        );

        assert.equal(
          body.replayId,
          replayId,
        );
      },
    );
  },
);

test(
  "live HTTP route reads a real persisted Genesis execution through the certified status projection",
  async () => {
    const store =
      persistence();

    const manifestBuild =
      build([
        entry(
          "http-fixture",
        ),
      ]);

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

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays/${plan.replayId}/status`,
          );

        assert.equal(
          response.status,
          200,
        );

        const body =
          await response.json() as {
            ok:
              boolean;

            status: {
              replayId:
                string;

              found:
                boolean;

              manifestPresent:
                boolean;

              executionPresent:
                boolean;

              executionStatus:
                string;

              currentManifestIndex:
                number | null;

              recovery: {
                eligible:
                  boolean;

                reason:
                  string;
              };
            };
          };

        assert.equal(
          body.ok,
          true,
        );

        assert.equal(
          body.status.replayId,
          plan.replayId,
        );

        assert.equal(
          body.status.found,
          true,
        );

        assert.equal(
          body.status
            .manifestPresent,
          true,
        );

        assert.equal(
          body.status
            .executionPresent,
          true,
        );

        assert.equal(
          body.status
            .executionStatus,
          "running",
        );

        assert.equal(
          body.status
            .currentManifestIndex,
          0,
        );

        assert.deepEqual(
          body.status.recovery,
          {
            eligible:
              true,

            reason:
              "ELIGIBLE",
          },
        );
      },
    );
  },
);

test(
  "live loopback HTTP access follows existing runtime-access contract",
  async () => {
    const store =
      persistence();

    const manifestBuild =
      build([]);

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

    const originalToken =
      process.env
        .KORELUMINA_RUNTIME_INTERNAL_TOKEN;

    process.env
      .KORELUMINA_RUNTIME_INTERNAL_TOKEN =
        "configured-token";

    try {
      await withServer(
        store,
        async (
          baseUrl,
        ) => {
          /*
           * requireRuntimeAccess explicitly permits loopback.
           * This test certifies the actual HTTP composition,
           * rather than inventing a stricter Genesis-specific
           * authentication policy.
           */
          const response =
            await fetch(
              `${baseUrl}/api/runtime/genesis/replays/${plan.replayId}/status`,
            );

          assert.equal(
            response.status,
            200,
          );
        },
      );
    } finally {
      if (
        originalToken ===
        undefined
      ) {
        delete process.env
          .KORELUMINA_RUNTIME_INTERNAL_TOKEN;
      } else {
        process.env
          .KORELUMINA_RUNTIME_INTERNAL_TOKEN =
            originalToken;
      }
    }
  },
);

test(
  "live HTTP route fails closed when the real persisted Genesis artifact is corrupted",
  async () => {
    const store =
      persistence();

    const manifestBuild =
      build([
        entry(
          "corrupt-http-fixture",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    store.saveManifestBuild(
      manifestBuild,
    );

    const manifestFile =
      store.pathsFor(
        plan.replayId,
      ).manifestBuildFile;

    writeFileSync(
      manifestFile,
      '{"manifest":',
      "utf8",
    );

    const corruptBefore =
      readFileSync(
        manifestFile,
        "utf8",
      );

    await withServer(
      store,
      async (
        baseUrl,
      ) => {
        const response =
          await fetch(
            `${baseUrl}/api/runtime/genesis/replays/${plan.replayId}/status`,
          );

        assert.equal(
          response.status,
          409,
        );

        const body =
          await response.json() as {
            ok:
              boolean;

            error:
              string;
          };

        assert.equal(
          body.ok,
          false,
        );

        assert.equal(
          body.error,
          "genesis_replay_persistence_corrupt_json",
        );
      },
    );

    assert.equal(
      readFileSync(
        manifestFile,
        "utf8",
      ),
      corruptBefore,
    );
  },
);
