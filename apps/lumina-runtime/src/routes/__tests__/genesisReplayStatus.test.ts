import assert from "node:assert/strict";
import test from "node:test";

import type {
  Request,
  Response,
} from "express";

import {
  createGenesisReplayStatusHandler,
  parseGenesisReplayId,
  registerGenesisReplayStatusRoute,
} from "../genesisReplayStatus.js";

import {
  requireRuntimeAccess,
} from "../runtimeAccess.js";

const VALID_REPLAY_ID =
  `genesis-replay:${"a".repeat(
    64,
  )}`;

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

function requestFor(
  replayId:
    string,
): Request {
  return {
    params: {
      replayId,
    },
  } as unknown as
    Request;
}

test(
  "Replay ID parser accepts deterministic SHA-256 Replay Identity format",
  () => {
    assert.equal(
      parseGenesisReplayId(
        VALID_REPLAY_ID,
      ),
      VALID_REPLAY_ID,
    );
  },
);

test(
  "Replay ID parser rejects malformed Replay Identity values",
  () => {
    const invalid = [
      "",
      "genesis-replay:",
      "genesis-replay:abc",
      `genesis-replay:${"A".repeat(
        64,
      )}`,
      `genesis-replay:${"g".repeat(
        64,
      )}`,
      `other:${"a".repeat(
        64,
      )}`,
      `genesis-replay:${"a".repeat(
        65,
      )}`,
    ];

    for (
      const value
      of invalid
    ) {
      assert.throws(
        () =>
          parseGenesisReplayId(
            value,
          ),
        /genesis_replay_id_invalid/,
      );
    }
  },
);

test(
  "invalid Replay Identity is rejected before persistence access",
  () => {
    let reads =
      0;

    const handler =
      createGenesisReplayStatusHandler({
        persistence: {
          loadManifestBuild() {
            reads +=
              1;

            return null;
          },

          loadExecution() {
            reads +=
              1;

            return null;
          },

          loadRunnerResult() {
            reads +=
              1;

            return null;
          },
        },

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      requestFor(
        "invalid",
      ),
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      400,
    );

    assert.deepEqual(
      recorder.body(),
      {
        ok:
          false,

        error:
          "genesis_replay_id_invalid",
      },
    );

    assert.equal(
      reads,
      0,
    );
  },
);

test(
  "valid Replay Identity with no persisted replay returns not found",
  () => {
    const handler =
      createGenesisReplayStatusHandler({
        persistence: {
          loadManifestBuild() {
            return null;
          },

          loadExecution() {
            return null;
          },

          loadRunnerResult() {
            return null;
          },
        },

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      requestFor(
        VALID_REPLAY_ID,
      ),
      recorder.response,
      () => {},
    );

    assert.equal(
      recorder.statusCode(),
      404,
    );

    assert.deepEqual(
      recorder.body(),
      {
        ok:
          false,

        error:
          "genesis_replay_not_found",

        replayId:
          VALID_REPLAY_ID,
      },
    );
  },
);

test(
  "route delegates successful projection to Genesis Replay Status Service",
  () => {
    const handler =
      createGenesisReplayStatusHandler({
        persistence: {
          loadManifestBuild() {
            return {
              manifest: {
                manifestId:
                  "genesis-manifest:fixture",

                replayContractVersion:
                  "1.0",

                scope: {
                  mode:
                    "partial",

                  repository:
                    "owner/repository",

                  includedEvidenceTypes:
                    [],

                  excludedEvidenceTypes:
                    [],

                  explicitlyExcludedSourceIds:
                    [],

                  governancePolicyVersion:
                    "governance-v1",

                  replayContractVersion:
                    "1.0",
                },

                entries:
                  [],

                discoveredAt:
                  100,
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
          },

          loadExecution() {
            return null;
          },

          loadRunnerResult() {
            return null;
          },
        },

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      requestFor(
        VALID_REPLAY_ID,
      ),
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

        status: {
          replayId:
            string;

          manifestPresent:
            boolean;

          executionPresent:
            boolean;
        };
      };

    assert.equal(
      body.ok,
      true,
    );

    assert.equal(
      body.status.replayId,
      VALID_REPLAY_ID,
    );

    assert.equal(
      body.status
        .manifestPresent,
      true,
    );

    assert.equal(
      body.status
        .executionPresent,
      false,
    );
  },
);

test(
  "persistence integrity failure remains distinct from not found",
  () => {
    const handler =
      createGenesisReplayStatusHandler({
        persistence: {
          loadManifestBuild() {
            throw new Error(
              "genesis_replay_persistence_corrupt_json",
            );
          },

          loadExecution() {
            return null;
          },

          loadRunnerResult() {
            return null;
          },
        },

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    const recorder =
      responseRecorder();

    handler(
      requestFor(
        VALID_REPLAY_ID,
      ),
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
          "genesis_replay_persistence_corrupt_json",

        replayId:
          VALID_REPLAY_ID,
      },
    );
  },
);

test(
  "route registration applies runtime access middleware before status handler",
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

    registerGenesisReplayStatusRoute(
      app as never,
      {
        persistence: {
          loadManifestBuild() {
            return null;
          },

          loadExecution() {
            return null;
          },

          loadRunnerResult() {
            return null;
          },
        },

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
      "/api/runtime/genesis/replays/:replayId/status",
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

test(
  "existing runtime access middleware rejects unauthorized non-loopback Genesis status access",
  () => {
    const originalToken =
      process.env
        .KORELUMINA_RUNTIME_INTERNAL_TOKEN;

    process.env
      .KORELUMINA_RUNTIME_INTERNAL_TOKEN =
        "fixture-runtime-token";

    let nextCalled =
      false;

    let statusCode =
      200;

    let body:
      unknown =
        undefined;

    const req = {
      header(
        name:
          string,
      ) {
        if (
          name ===
          "x-korelumina-runtime-token"
        ) {
          return undefined;
        }

        return undefined;
      },

      socket: {
        remoteAddress:
          "203.0.113.42",
      },
    } as unknown as
      Request;

    const res = {
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

    try {
      requireRuntimeAccess(
        req,
        res,
        () => {
          nextCalled =
            true;
        },
      );

      assert.equal(
        nextCalled,
        false,
      );

      assert.equal(
        statusCode,
        403,
      );

      assert.deepEqual(
        body,
        {
          ok:
            false,

          error:
            "runtime_access_denied",
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
  "existing runtime access middleware permits valid internal token before Genesis status handling",
  () => {
    const originalToken =
      process.env
        .KORELUMINA_RUNTIME_INTERNAL_TOKEN;

    process.env
      .KORELUMINA_RUNTIME_INTERNAL_TOKEN =
        "fixture-runtime-token";

    let nextCalled =
      false;

    const req = {
      header(
        name:
          string,
      ) {
        if (
          name ===
          "x-korelumina-runtime-token"
        ) {
          return "fixture-runtime-token";
        }

        return undefined;
      },

      socket: {
        remoteAddress:
          "203.0.113.42",
      },
    } as unknown as
      Request;

    const res = {
      status() {
        throw new Error(
          "authorized request must not be rejected",
        );
      },

      json() {
        throw new Error(
          "authorized request must not be rejected",
        );
      },
    } as unknown as
      Response;

    try {
      requireRuntimeAccess(
        req,
        res,
        () => {
          nextCalled =
            true;
        },
      );

      assert.equal(
        nextCalled,
        true,
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
