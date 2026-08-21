import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  createKnowledgePreservationPlatform,
} from "../../knowledge-preservation/bootstrap/index.js";

import {
  FileGenesisReplayPersistenceStore,
} from "../../knowledge-preservation/genesis/index.js";

import {
  createGenesisReplayExecutionHandler,
} from "../genesisReplayExecution.js";

function runtime(
  execute:
    NonNullable<
      Parameters<
        typeof createGenesisReplayExecutionHandler
      >[0]["execute"]
    >,
) {
  return {
    persistenceStore:
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          mkdtempSync(
            path.join(
              tmpdir(),
              "genesis-route-",
            ),
          ),
      }),

    platform:
      createKnowledgePreservationPlatform(),

    repositoryRoot:
      "/canonical/repository",

    now:
      () =>
        1000,

    execute,
  };
}

function partialScope() {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "feature/genesis-historical-replay",

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

function response() {
  const state: {
    status:
      number;

    body:
      unknown;
  } = {
    status:
      200,

    body:
      null,
  };

  return {
    state,

    res: {
      status(
        status:
          number,
      ) {
        state.status =
          status;

        return this;
      },

      json(
        body:
          unknown,
      ) {
        state.body =
          body;

        return this;
      },
    },
  };
}

test(
  "bounded Genesis execution accepts a partial dry-run scope",
  async () => {
    let called =
      false;

    const execute:
      NonNullable<
        Parameters<
          typeof createGenesisReplayExecutionHandler
        >[0]["execute"]
      > =
      async input => {
        called =
          true;

        assert.equal(
          input.mode,
          "DRY_RUN",
        );

        assert.equal(
          input.repositoryRoot,
          "/canonical/repository",
        );

        assert.equal(
          input.scope.mode,
          "partial",
        );

        return {
          mode:
            "DRY_RUN",

          manifestBuild:
            {} as never,

          plan:
            {} as never,

          preflight:
            {} as never,

          runnerResult:
            null,
        };
      };

    const handler =
      createGenesisReplayExecutionHandler(
        runtime(
          execute,
        ),
      );

    const {
      state,
      res,
    } =
      response();

    await handler(
      {
        body: {
          mode:
            "DRY_RUN",

          scope:
            partialScope(),

          authorizeProductionAdmission:
            false,
        },
      } as never,
      res as never,
      (() => {}) as never,
    );

    assert.equal(
      called,
      true,
    );

    assert.equal(
      state.status,
      200,
    );

    assert.equal(
      (
        state.body as {
          ok:
            boolean;
        }
      ).ok,
      true,
    );
  },
);

test(
  "bounded Genesis execution rejects full replay scope",
  async () => {
    const handler =
      createGenesisReplayExecutionHandler(
        runtime(
          async () => {
            throw new Error(
              "must_not_execute",
            );
          },
        ),
      );

    const {
      state,
      res,
    } =
      response();

    await handler(
      {
        body: {
          mode:
            "DRY_RUN",

          scope: {
            ...partialScope(),
            mode:
              "full",
          },

          authorizeProductionAdmission:
            false,
        },
      } as never,
      res as never,
      (() => {}) as never,
    );

    assert.equal(
      state.status,
      400,
    );

    assert.deepEqual(
      state.body,
      {
        ok:
          false,

        error:
          "genesis_bounded_replay_partial_scope_required",
      },
    );
  },
);

test(
  "production admission requires explicit authorization",
  async () => {
    const handler =
      createGenesisReplayExecutionHandler(
        runtime(
          async () => {
            throw new Error(
              "must_not_execute",
            );
          },
        ),
      );

    const {
      state,
      res,
    } =
      response();

    await handler(
      {
        body: {
          mode:
            "PRODUCTION_ADMISSION",

          scope:
            partialScope(),

          authorizeProductionAdmission:
            false,
        },
      } as never,
      res as never,
      (() => {}) as never,
    );

    assert.equal(
      state.status,
      403,
    );

    assert.deepEqual(
      state.body,
      {
        ok:
          false,

        error:
          "genesis_replay_execution_production_authorization_required",
      },
    );
  },
);
