import assert from "node:assert/strict";
import test from "node:test";

import {
  GenesisReplayReadApiError,
  assertGenesisReplayId,
  createGenesisReplayReadClient,
} from "../genesisReplayReadClient.js";

const REPLAY_ID =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

function response(
  status:
    number,

  body:
    unknown,
): Response {
  return new Response(
    JSON.stringify(
      body,
    ),
    {
      status,

      headers: {
        "content-type":
          "application/json",
      },
    },
  );
}

test(
  "Replay Identity guard accepts only certified deterministic wire format",
  () => {
    assert.doesNotThrow(
      () =>
        assertGenesisReplayId(
          REPLAY_ID,
        ),
    );

    for (
      const invalid
      of [
        "",
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
      ]
    ) {
      assert.throws(
        () =>
          assertGenesisReplayId(
            invalid,
          ),
        /genesis_replay_id_invalid/,
      );
    }
  },
);

test(
  "inventory client issues GET to certified inventory endpoint with caller headers",
  async () => {
    const requests:
      {
        url:
          string;

        init?:
          RequestInit;
      }[] =
        [];

    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test/",

        getHeaders:
          () => ({
            "x-test-caller":
              "fixture",
          }),

        fetchImpl:
          async (
            input,
            init,
          ) => {
            requests.push({
              url:
                String(
                  input,
                ),

              init,
            });

            return response(
              200,
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
      });

    const inventory =
      await client
        .listReplays();

    assert.deepEqual(
      inventory,
      {
        total:
          0,

        replayIds:
          [],

        replays:
          [],
      },
    );

    assert.equal(
      requests.length,
      1,
    );

    assert.equal(
      requests[0].url,
      "http://runtime.test/api/runtime/genesis/replays",
    );

    assert.equal(
      requests[0]
        .init
        ?.method,
      "GET",
    );

    assert.deepEqual(
      requests[0]
        .init
        ?.headers,
      {
        "x-test-caller":
          "fixture",
      },
    );
  },
);

test(
  "status client validates Replay Identity before network access",
  async () => {
    let called =
      false;

    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () => {
            called =
              true;

            return response(
              500,
              {},
            );
          },
      });

    await assert.rejects(
      () =>
        client.getReplayStatus(
          "genesis-replay:invalid",
        ),
      /genesis_replay_id_invalid/,
    );

    assert.equal(
      called,
      false,
    );
  },
);

test(
  "status client issues GET to encoded certified status endpoint",
  async () => {
    let requestUrl =
      "";

    let requestMethod:
      string |
      undefined;

    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async (
            input,
            init,
          ) => {
            requestUrl =
              String(
                input,
              );

            requestMethod =
              init?.method;

            return response(
              200,
              {
                ok:
                  true,

                status: {
                  replayId:
                    REPLAY_ID,

                  found:
                    true,
                },
              },
            );
          },
      });

    const status =
      await client
        .getReplayStatus(
          REPLAY_ID,
        );

    assert.equal(
      requestUrl,
      `http://runtime.test/api/runtime/genesis/replays/${encodeURIComponent(
        REPLAY_ID,
      )}/status`,
    );

    assert.equal(
      requestMethod,
      "GET",
    );

    assert.equal(
      status.replayId,
      REPLAY_ID,
    );
  },
);

test(
  "runtime error envelope becomes typed GenesisReplayReadApiError",
  async () => {
    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              409,
              {
                ok:
                  false,

                error:
                  "genesis_replay_inventory_corrupt_json",
              },
            ),
      });

    await assert.rejects(
      async () => {
        await client
          .listReplays();
      },
      (
        error:
          unknown,
      ) => {
        assert.ok(
          error instanceof
            GenesisReplayReadApiError,
        );

        assert.equal(
          error.status,
          409,
        );

        assert.equal(
          error.code,
          "genesis_replay_inventory_corrupt_json",
        );

        return true;
      },
    );
  },
);

test(
  "status not-found preserves status code error code and Replay Identity",
  async () => {
    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              404,
              {
                ok:
                  false,

                error:
                  "genesis_replay_not_found",

                replayId:
                  REPLAY_ID,
              },
            ),
      });

    await assert.rejects(
      async () => {
        await client
          .getReplayStatus(
            REPLAY_ID,
          );
      },
      (
        error:
          unknown,
      ) => {
        assert.ok(
          error instanceof
            GenesisReplayReadApiError,
        );

        assert.equal(
          error.status,
          404,
        );

        assert.equal(
          error.code,
          "genesis_replay_not_found",
        );

        assert.equal(
          error.replayId,
          REPLAY_ID,
        );

        return true;
      },
    );
  },
);

test(
  "client rejects malformed successful inventory envelope",
  async () => {
    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              200,
              {
                ok:
                  true,

                inventory: {
                  total:
                    "wrong",

                  replayIds:
                    [],

                  replays:
                    [],
                },
              },
            ),
      });

    await assert.rejects(
      () =>
        client.listReplays(),
      (
        error:
          unknown,
      ) => {
        assert.ok(
          error instanceof
            GenesisReplayReadApiError,
        );

        assert.equal(
          error.code,
          "genesis_replay_inventory_response_invalid",
        );

        return true;
      },
    );
  },
);

test(
  "client rejects status response whose Replay Identity does not match request",
  async () => {
    const otherReplayId =
      `genesis-replay:${"b".repeat(
        64,
      )}`;

    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              200,
              {
                ok:
                  true,

                status: {
                  replayId:
                    otherReplayId,

                  found:
                    true,
                },
              },
            ),
      });

    await assert.rejects(
      () =>
        client.getReplayStatus(
          REPLAY_ID,
        ),
      (
        error:
          unknown,
      ) => {
        assert.ok(
          error instanceof
            GenesisReplayReadApiError,
        );

        assert.equal(
          error.code,
          "genesis_replay_status_response_invalid",
        );

        return true;
      },
    );
  },
);

test(
  "Genesis read client exposes no mutation methods",
  () => {
    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              200,
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
            ),
      });

    assert.deepEqual(
      Object.keys(
        client,
      ).sort(),
      [
        "getReplayStatus",
        "listReplays",
      ],
    );
  },
);

test(
  "runtime access denial is preserved exactly as typed Genesis replay client error",
  async () => {
    const client =
      createGenesisReplayReadClient({
        baseUrl:
          "http://runtime.test",

        fetchImpl:
          async () =>
            response(
              403,
              {
                ok:
                  false,

                error:
                  "runtime_access_denied",
              },
            ),
      });

    await assert.rejects(
      async () => {
        await client
          .listReplays();
      },
      (
        error:
          unknown,
      ) => {
        assert.ok(
          error instanceof
            GenesisReplayReadApiError,
        );

        assert.equal(
          error.status,
          403,
        );

        assert.equal(
          error.code,
          "runtime_access_denied",
        );

        assert.equal(
          error.message,
          "runtime_access_denied",
        );

        return true;
      },
    );
  },
);
