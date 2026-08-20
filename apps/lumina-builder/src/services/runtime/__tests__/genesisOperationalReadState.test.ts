import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisOperationalProjection,
  GenesisOperationalReadClient,
} from "../genesisOperationalReadClient.js";

import {
  GenesisOperationalReadApiError,
} from "../genesisOperationalReadClient.js";

import {
  createGenesisOperationalReadStateAdapter,
} from "../genesisOperationalReadState.js";

const replayA =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

const replayB =
  `genesis-replay:${"b".repeat(
    64,
  )}` as const;

function projection(
  replayId:
    typeof replayA |
    typeof replayB,
): GenesisOperationalProjection {
  return {
    projectionId:
      "genesis-operational:fixture",

    replayId,

    corpus: {
      projectionId:
        "genesis-corpus-projection:fixture",
    } as
      GenesisOperationalProjection["corpus"],

    chronology: {
      projectionId:
        "genesis-chronology:fixture",
    } as
      GenesisOperationalProjection["chronology"],

    documentationGovernance: {
      projectionId:
        "genesis-document-governance:fixture",
    } as
      GenesisOperationalProjection["documentationGovernance"],

    knowledgeLifecycle: {
      projectionId:
        "genesis-knowledge-lifecycle:fixture",
    } as
      GenesisOperationalProjection["knowledgeLifecycle"],

    readiness: {
      projectionId:
        "genesis-readiness:fixture",
    } as
      GenesisOperationalProjection["readiness"],

    conversationSource: {
      projectionId:
        "genesis-conversation-boundary:fixture",
    } as
      GenesisOperationalProjection["conversationSource"],
  };
}

test(
  "adapter starts empty",
  () => {
    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async (
            replayId,
          ) =>
            projection(
              replayId as
                typeof replayA,
            ),
      });

    assert.deepEqual(
      adapter.getState(),
      {
        replayId:
          null,

        projection:
          null,

        loading:
          false,

        loaded:
          false,

        error:
          null,
      },
    );
  },
);

test(
  "load publishes selected operational projection",
  async () => {
    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async () =>
            projection(
              replayA,
            ),
      });

    await adapter.load(
      replayA,
    );

    assert.equal(
      adapter
        .getState()
        .projection
        ?.replayId,
      replayA,
    );

    assert.equal(
      adapter
        .getState()
        .loaded,
      true,
    );
  },
);

test(
  "load preserves typed API error",
  async () => {
    const client:
      GenesisOperationalReadClient = {
        getOperationalProjection:
          async () => {
            throw new GenesisOperationalReadApiError({
              status:
                409,

              code:
                "genesis_operational_projection_correlation_not_found",

              replayId:
                replayA,
            });
          },
      };

    const adapter =
      createGenesisOperationalReadStateAdapter(
        client,
      );

    await adapter.load(
      replayA,
    );

    assert.equal(
      adapter
        .getState()
        .error
        ?.code,
      "genesis_operational_projection_correlation_not_found",
    );

    assert.equal(
      adapter
        .getState()
        .error
        ?.status,
      409,
    );
  },
);

test(
  "refresh reloads current replay",
  async () => {
    let calls =
      0;

    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async () => {
            calls +=
              1;

            return projection(
              replayA,
            );
          },
      });

    await adapter.load(
      replayA,
    );

    await adapter.refresh();

    assert.equal(
      calls,
      2,
    );
  },
);

test(
  "refresh with no replay is a no-op",
  async () => {
    let calls =
      0;

    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async () => {
            calls +=
              1;

            return projection(
              replayA,
            );
          },
      });

    await adapter.refresh();

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "stale earlier request cannot overwrite newer replay",
  async () => {
    let resolveA:
      (
        projection:
          GenesisOperationalProjection,
      ) => void =
        () => {};

    const pendingA =
      new Promise<
        GenesisOperationalProjection
      >(
        (
          resolve,
        ) => {
          resolveA =
            resolve;
        },
      );

    const client:
      GenesisOperationalReadClient = {
        getOperationalProjection:
          async (
            replayId,
          ) =>
            replayId ===
              replayA
              ? pendingA
              : projection(
                  replayB,
                ),
      };

    const adapter =
      createGenesisOperationalReadStateAdapter(
        client,
      );

    const first =
      adapter.load(
        replayA,
      );

    await adapter.load(
      replayB,
    );

    resolveA(
      projection(
        replayA,
      ),
    );

    await first;

    assert.equal(
      adapter
        .getState()
        .replayId,
      replayB,
    );

    assert.equal(
      adapter
        .getState()
        .projection
        ?.replayId,
      replayB,
    );
  },
);

test(
  "clear invalidates in-flight request",
  async () => {
    let resolve:
      (
        projection:
          GenesisOperationalProjection,
      ) => void =
        () => {};

    const pending =
      new Promise<
        GenesisOperationalProjection
      >(
        (
          done,
        ) => {
          resolve =
            done;
        },
      );

    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async () =>
            pending,
      });

    const request =
      adapter.load(
        replayA,
      );

    adapter.clear();

    resolve(
      projection(
        replayA,
      ),
    );

    await request;

    assert.equal(
      adapter
        .getState()
        .replayId,
      null,
    );

    assert.equal(
      adapter
        .getState()
        .projection,
      null,
    );
  },
);

test(
  "stale earlier failure cannot overwrite newer successful replay",
  async () => {
    let rejectA:
      (
        reason?:
          unknown,
      ) => void =
        () => {};

    const pendingA =
      new Promise<
        GenesisOperationalProjection
      >(
        (
          _resolve,
          reject,
        ) => {
          rejectA =
            reject;
        },
      );

    const client:
      GenesisOperationalReadClient = {
        getOperationalProjection:
          async (
            replayId,
          ) =>
            replayId ===
              replayA
              ? pendingA
              : projection(
                  replayB,
                ),
      };

    const adapter =
      createGenesisOperationalReadStateAdapter(
        client,
      );

    const first =
      adapter.load(
        replayA,
      );

    await adapter.load(
      replayB,
    );

    rejectA(
      new GenesisOperationalReadApiError({
        status:
          409,

        code:
          "stale_failure",

        replayId:
          replayA,
      }),
    );

    await first;

    const state =
      adapter.getState();

    assert.equal(
      state.replayId,
      replayB,
    );

    assert.equal(
      state.projection?.replayId,
      replayB,
    );

    assert.equal(
      state.error,
      null,
    );
  },
);

test(
  "loading a different replay clears prior operational projection immediately",
  async () => {
    let resolveB:
      (
        value:
          GenesisOperationalProjection,
      ) => void =
        () => {};

    const pendingB =
      new Promise<
        GenesisOperationalProjection
      >(
        (
          resolve,
        ) => {
          resolveB =
            resolve;
        },
      );

    const client:
      GenesisOperationalReadClient = {
        getOperationalProjection:
          async (
            replayId,
          ) =>
            replayId ===
              replayA
              ? projection(
                  replayA,
                )
              : pendingB,
      };

    const adapter =
      createGenesisOperationalReadStateAdapter(
        client,
      );

    await adapter.load(
      replayA,
    );

    const second =
      adapter.load(
        replayB,
      );

    assert.equal(
      adapter
        .getState()
        .replayId,
      replayB,
    );

    assert.equal(
      adapter
        .getState()
        .projection,
      null,
    );

    assert.equal(
      adapter
        .getState()
        .loading,
      true,
    );

    resolveB(
      projection(
        replayB,
      ),
    );

    await second;
  },
);

test(
  "clearError removes error without clearing replay selection",
  async () => {
    const client:
      GenesisOperationalReadClient = {
        getOperationalProjection:
          async () => {
            throw new GenesisOperationalReadApiError({
              status:
                409,

              code:
                "fixture_error",

              replayId:
                replayA,
            });
          },
      };

    const adapter =
      createGenesisOperationalReadStateAdapter(
        client,
      );

    await adapter.load(
      replayA,
    );

    assert.notEqual(
      adapter
        .getState()
        .error,
      null,
    );

    adapter.clearError();

    assert.equal(
      adapter
        .getState()
        .error,
      null,
    );

    assert.equal(
      adapter
        .getState()
        .replayId,
      replayA,
    );

    assert.equal(
      adapter
        .getState()
        .loaded,
      true,
    );
  },
);

test(
  "state subscribers receive operational state transitions and can unsubscribe",
  async () => {
    const adapter =
      createGenesisOperationalReadStateAdapter({
        getOperationalProjection:
          async () =>
            projection(
              replayA,
            ),
      });

    let notifications =
      0;

    const unsubscribe =
      adapter.subscribe(
        () => {
          notifications +=
            1;
        },
      );

    await adapter.load(
      replayA,
    );

    const beforeUnsubscribe =
      notifications;

    assert.ok(
      beforeUnsubscribe >=
        2,
    );

    unsubscribe();

    adapter.clear();

    assert.equal(
      notifications,
      beforeUnsubscribe,
    );
  },
);
