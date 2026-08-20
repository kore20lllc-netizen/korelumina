import assert from "node:assert/strict";
import test from "node:test";

import {
  GenesisOperationalReadApiError,
  createGenesisOperationalReadClient,
} from "../genesisOperationalReadClient.js";

const replayId =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

function projection() {
  return {
    projectionId:
      "genesis-operational:fixture",

    replayId,

    corpus: {
      projectionId:
        "genesis-corpus-projection:fixture",
    },

    chronology: {
      projectionId:
        "genesis-chronology:fixture",
    },

    documentationGovernance: {
      projectionId:
        "genesis-document-governance:fixture",
    },

    knowledgeLifecycle: {
      projectionId:
        "genesis-knowledge-lifecycle:fixture",
    },

    readiness: {
      projectionId:
        "genesis-readiness:fixture",
    },

    conversationSource: {
      projectionId:
        "genesis-conversation-boundary:fixture",
    },
  };
}

test(
  "client requests replay-scoped operational endpoint with GET",
  async () => {
    let url =
      "";

    let method =
      "";

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://localhost:4100/",

        fetchImpl:
          async (
            input,
            init,
          ) => {
            url =
              String(
                input,
              );

            method =
              String(
                init?.method,
              );

            return new Response(
              JSON.stringify({
                ok:
                  true,

                projection:
                  projection(),
              }),
              {
                status:
                  200,

                headers: {
                  "content-type":
                    "application/json",
                },
              },
            );
          },
      });

    await client
      .getOperationalProjection(
        replayId,
      );

    assert.equal(
      url,
      `http://localhost:4100/api/runtime/genesis/replays/${encodeURIComponent(
        replayId,
      )}/operational`,
    );

    assert.equal(
      method,
      "GET",
    );
  },
);

test(
  "client returns typed operational projection",
  async () => {
    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              JSON.stringify({
                ok:
                  true,

                projection:
                  projection(),
              }),
              {
                status:
                  200,
              },
            ),
      });

    const result =
      await client
        .getOperationalProjection(
          replayId,
        );

    assert.equal(
      result.replayId,
      replayId,
    );

    assert.equal(
      result
        .conversationSource
        .projectionId,
      "genesis-conversation-boundary:fixture",
    );
  },
);

test(
  "client rejects invalid replay identity before fetch",
  async () => {
    let calls =
      0;

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () => {
            calls +=
              1;

            return new Response();
          },
      });

    await assert.rejects(
      client.getOperationalProjection(
        "invalid" as
          typeof replayId,
      ),
      /genesis_replay_id_invalid/,
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "client rejects projection for another replay",
  async () => {
    const otherReplayId =
      `genesis-replay:${"b".repeat(
        64,
      )}`;

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              JSON.stringify({
                ok:
                  true,

                projection: {
                  ...projection(),

                  replayId:
                    otherReplayId,
                },
              }),
              {
                status:
                  200,
              },
            ),
      });

    await assert.rejects(
      client.getOperationalProjection(
        replayId,
      ),
      (
        error:
          unknown,
      ) =>
        error instanceof
          GenesisOperationalReadApiError &&
        error.code ===
          "genesis_operational_projection_response_invalid",
    );
  },
);

test(
  "client rejects response missing certified child projection identity",
  async () => {
    const value =
      projection();

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              JSON.stringify({
                ok:
                  true,

                projection: {
                  ...value,

                  readiness:
                    {},
                },
              }),
              {
                status:
                  200,
              },
            ),
      });

    await assert.rejects(
      client.getOperationalProjection(
        replayId,
      ),
      (
        error:
          unknown,
      ) =>
        error instanceof
          GenesisOperationalReadApiError &&
        error.code ===
          "genesis_operational_projection_response_invalid",
    );
  },
);

test(
  "client preserves runtime error code",
  async () => {
    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              JSON.stringify({
                ok:
                  false,

                error:
                  "genesis_operational_projection_correlation_not_found",
              }),
              {
                status:
                  409,
              },
            ),
      });

    await assert.rejects(
      client.getOperationalProjection(
        replayId,
      ),
      (
        error:
          unknown,
      ) =>
        error instanceof
          GenesisOperationalReadApiError &&
        error.status ===
          409 &&
        error.code ===
          "genesis_operational_projection_correlation_not_found",
    );
  },
);

test(
  "client rejects invalid JSON",
  async () => {
    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              "{",
              {
                status:
                  200,
              },
            ),
      });

    await assert.rejects(
      client.getOperationalProjection(
        replayId,
      ),
      (
        error:
          unknown,
      ) =>
        error instanceof
          GenesisOperationalReadApiError &&
        error.code ===
          "genesis_operational_read_invalid_json",
    );
  },
);

test(
  "client forwards runtime caller headers",
  async () => {
    let auth =
      "";

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        getHeaders:
          () => ({
            "x-korelumina-runtime-token":
              "fixture",
          }),

        fetchImpl:
          async (
            _,
            init,
          ) => {
            const headers =
              new Headers(
                init?.headers,
              );

            auth =
              headers.get(
                "x-korelumina-runtime-token",
              ) ??
              "";

            return new Response(
              JSON.stringify({
                ok:
                  true,

                projection:
                  projection(),
              }),
              {
                status:
                  200,
              },
            );
          },
      });

    await client
      .getOperationalProjection(
        replayId,
      );

    assert.equal(
      auth,
      "fixture",
    );
  },
);

test(
  "client rejects response missing conversation source projection identity",
  async () => {
    const value =
      projection();

    const client =
      createGenesisOperationalReadClient({
        baseUrl:
          "http://runtime",

        fetchImpl:
          async () =>
            new Response(
              JSON.stringify({
                ok:
                  true,

                projection: {
                  ...value,

                  conversationSource:
                    {},
                },
              }),
              {
                status:
                  200,
              },
            ),
      });

    await assert.rejects(
      client.getOperationalProjection(
        replayId,
      ),
      (
        error:
          unknown,
      ) =>
        error instanceof
          GenesisOperationalReadApiError &&
        error.code ===
          "genesis_operational_projection_response_invalid",
    );
  },
);
