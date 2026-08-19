import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  Request,
  Response,
} from "express";

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
  createGenesisReplayInventoryHandler,
  registerGenesisReplayInventoryRoute,
} from "../genesisReplayInventory.js";

import {
  requireRuntimeAccess,
} from "../runtimeAccess.js";

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
          "korelumina-genesis-inventory-route-",
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
    plan,
    execution,
  };
}

function responseRecorder() {
  let statusCode =
    200;

  let body:
    unknown =
      undefined;

  const response = {
    status(
      code:
        number,
    ) {
      statusCode =
        code;

      return this;
    },

    json(
      value:
        unknown,
    ) {
      body =
        value;

      return this;
    },
  } as unknown as
    Response;

  return {
    response,

    statusCode:
      () =>
        statusCode,

    body:
      () =>
        body,
  };
}

const request =
  {} as Request;

test(
  "empty persisted Genesis store returns successful empty inventory",
  () => {
    const store =
      persistence();

    const handler =
      createGenesisReplayInventoryHandler({
        persistence:
          store,

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      request,
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      200,
    );

    assert.deepEqual(
      recorder.body(),
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

test(
  "inventory route returns deterministic persisted replay inventory",
  () => {
    const store =
      persistence();

    const first =
      persistReplay(
        store,
        "route-a",
      );

    const second =
      persistReplay(
        store,
        "route-b",
      );

    const handler =
      createGenesisReplayInventoryHandler({
        persistence:
          store,

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      request,
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      200,
    );

    const body =
      recorder.body() as {
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

              executionStatus:
                string | null;
            }[];
        };
      };

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
      [
        first.plan.replayId,
        second.plan.replayId,
      ].sort(),
    );

    assert.deepEqual(
      body.inventory.replays
        .map(
          (
            replay,
          ) =>
            replay.replayId,
        ),
      body.inventory.replayIds,
    );

    assert.equal(
      body.inventory.replays
        .every(
          (
            replay,
          ) =>
            replay.executionStatus ===
            "running",
        ),
      true,
    );
  },
);

test(
  "inventory route exposes manifest-only persisted replay through certified inventory projection",
  () => {
    const store =
      persistence();

    const manifestBuild =
      build(
        "manifest-only-route",
      );

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    store.saveManifestBuild(
      manifestBuild,
    );

    const handler =
      createGenesisReplayInventoryHandler({
        persistence:
          store,

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      request,
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      200,
    );

    const body =
      recorder.body() as {
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

test(
  "inventory integrity failure is returned as conflict instead of empty inventory",
  () => {
    const store =
      persistence();

    const corruptDirectory =
      path.join(
        store.storageRoot,
        "a".repeat(
          64,
        ),
      );

    mkdirSync(
      corruptDirectory,
      {
        recursive:
          true,
      },
    );

    writeFileSync(
      path.join(
        corruptDirectory,
        "execution.json",
      ),
      '{"plan":',
      "utf8",
    );

    const handler =
      createGenesisReplayInventoryHandler({
        persistence:
          store,

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      request,
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      409,
    );

    assert.deepEqual(
      recorder.body(),
      {
        ok:
          false,

        error:
          "genesis_replay_inventory_corrupt_json",
      },
    );
  },
);

test(
  "route registration applies runtime access middleware before inventory handler",
  () => {
    const registrations:
      unknown[][] =
        [];

    const app = {
      get(
        ...args:
          unknown[]
      ) {
        registrations.push(
          args,
        );

        return this;
      },
    };

    const store =
      persistence();

    registerGenesisReplayInventoryRoute(
      app as never,
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

    assert.equal(
      registrations.length,
      1,
    );

    assert.equal(
      registrations[0][0],
      "/api/runtime/genesis/replays",
    );

    assert.equal(
      registrations[0][1],
      requireRuntimeAccess,
    );

    assert.equal(
      typeof registrations[0][2],
      "function",
    );
  },
);
