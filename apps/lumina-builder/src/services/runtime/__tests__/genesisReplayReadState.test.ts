import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayId,
  GenesisReplayInventory,
  GenesisReplayReadClient,
  GenesisReplayStatusSnapshot,
} from "../genesisReplayReadClient.js";

import {
  GenesisReplayReadApiError,
} from "../genesisReplayReadClient.js";

import {
  createGenesisReplayReadStateAdapter,
} from "../genesisReplayReadState.js";

const REPLAY_A =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const REPLAY_B =
  `genesis-replay:${"b".repeat(
    64,
  )}` as GenesisReplayId;

function status(
  replayId:
    GenesisReplayId,
): GenesisReplayStatusSnapshot {
  return {
    replayId,

    found:
      true,

    manifestPresent:
      true,

    executionPresent:
      true,

    manifestId:
      "genesis-manifest:fixture",

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    totalManifestSources:
      1,

    executionStatus:
      "running",

    corpusStatus:
      "INCOMPLETE",

    currentManifestIndex:
      0,

    currentHistoricalSourceId:
      "genesis-source:commit:fixture",

    lastCompletedManifestIndex:
      null,

    progress: {
      totalSources:
        1,

      completedSources:
        0,

      admittedSources:
        0,

      skippedSources:
        0,

      rejectedSources:
        0,
    },

    checkpoint:
      null,

    runnerOutcome:
      null,

    runnerFailure:
      null,

    recovery: {
      eligible:
        true,

      reason:
        "ELIGIBLE",
    },

    admittedEvidenceIds:
      [],

    admissionLinks:
      [],

    allAdmittedEvidenceLinked:
      true,
  };
}

function inventory(
  replayIds:
    readonly GenesisReplayId[],
): GenesisReplayInventory {
  return {
    total:
      replayIds.length,

    replayIds,

    replays:
      replayIds.map(
        (
          replayId,
        ) =>
          status(
            replayId,
          ),
      ),
  };
}

test(
  "state adapter starts empty idle and non-error",
  () => {
    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    assert.deepEqual(
      adapter.getState(),
      {
        inventory:
          null,

        inventoryLoading:
          false,

        inventoryLoaded:
          false,

        selectedReplayId:
          null,

        selectedReplay:
          null,

        selectionLoading:
          false,

        error:
          null,
      },
    );
  },
);

test(
  "refreshInventory exposes loading then certified inventory",
  async () => {
    let resolveInventory:
      (
        value:
          GenesisReplayInventory,
      ) => void =
        () => {};

    const pending =
      new Promise<
        GenesisReplayInventory
      >(
        (
          resolve,
        ) => {
          resolveInventory =
            resolve;
        },
      );

    const client:
      GenesisReplayReadClient = {
        listReplays() {
          return pending;
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const refresh =
      adapter
        .refreshInventory();

    assert.equal(
      adapter
        .getState()
        .inventoryLoading,
      true,
    );

    resolveInventory(
      inventory([
        REPLAY_A,
      ]),
    );

    await refresh;

    assert.equal(
      adapter
        .getState()
        .inventoryLoading,
      false,
    );

    assert.equal(
      adapter
        .getState()
        .inventoryLoaded,
      true,
    );

    assert.deepEqual(
      adapter
        .getState()
        .inventory
        ?.replayIds,
      [
        REPLAY_A,
      ],
    );
  },
);

test(
  "inventory access error remains scoped and preserves governed code and status",
  async () => {
    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          throw new GenesisReplayReadApiError({
            status:
              403,

            code:
              "runtime_access_denied",
          });
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    await adapter
      .refreshInventory();

    assert.deepEqual(
      adapter
        .getState()
        .error,
      {
        scope:
          "inventory",

        message:
          "runtime_access_denied",

        code:
          "runtime_access_denied",

        status:
          403,
      },
    );
  },
);

test(
  "selectReplay exposes selected identity loading and resolved status",
  async () => {
    let resolveStatus:
      (
        value:
          GenesisReplayStatusSnapshot,
      ) => void =
        () => {};

    const pending =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          resolve,
        ) => {
          resolveStatus =
            resolve;
        },
      );

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        getReplayStatus() {
          return pending;
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const selection =
      adapter.selectReplay(
        REPLAY_A,
      );

    assert.equal(
      adapter
        .getState()
        .selectedReplayId,
      REPLAY_A,
    );

    assert.equal(
      adapter
        .getState()
        .selectionLoading,
      true,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay,
      null,
    );

    resolveStatus(
      status(
        REPLAY_A,
      ),
    );

    await selection;

    assert.equal(
      adapter
        .getState()
        .selectionLoading,
      false,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay
        ?.replayId,
      REPLAY_A,
    );
  },
);

test(
  "selection error preserves selected Replay Identity and typed runtime error",
  async () => {
    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          throw new GenesisReplayReadApiError({
            status:
              404,

            code:
              "genesis_replay_not_found",

            replayId,
          });
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    await adapter
      .selectReplay(
        REPLAY_A,
      );

    assert.equal(
      adapter
        .getState()
        .selectedReplayId,
      REPLAY_A,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay,
      null,
    );

    assert.deepEqual(
      adapter
        .getState()
        .error,
      {
        scope:
          "selection",

        message:
          "genesis_replay_not_found",

        code:
          "genesis_replay_not_found",

        status:
          404,
      },
    );
  },
);

test(
  "refreshSelected re-reads only the currently selected Replay Identity",
  async () => {
    const requested:
      GenesisReplayId[] =
        [];

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          requested.push(
            replayId,
          );

          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    await adapter
      .refreshSelected();

    assert.deepEqual(
      requested,
      [],
    );

    await adapter
      .selectReplay(
        REPLAY_A,
      );

    await adapter
      .refreshSelected();

    assert.deepEqual(
      requested,
      [
        REPLAY_A,
        REPLAY_A,
      ],
    );
  },
);

test(
  "newer selection wins over stale earlier status response",
  async () => {
    let resolveA:
      (
        value:
          GenesisReplayStatusSnapshot,
      ) => void =
        () => {};

    let resolveB:
      (
        value:
          GenesisReplayStatusSnapshot,
      ) => void =
        () => {};

    const pendingA =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          resolve,
        ) => {
          resolveA =
            resolve;
        },
      );

    const pendingB =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          resolve,
        ) => {
          resolveB =
            resolve;
        },
      );

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        getReplayStatus(
          replayId,
        ) {
          return replayId ===
            REPLAY_A
            ? pendingA
            : pendingB;
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const first =
      adapter.selectReplay(
        REPLAY_A,
      );

    const second =
      adapter.selectReplay(
        REPLAY_B,
      );

    resolveB(
      status(
        REPLAY_B,
      ),
    );

    await second;

    resolveA(
      status(
        REPLAY_A,
      ),
    );

    await first;

    assert.equal(
      adapter
        .getState()
        .selectedReplayId,
      REPLAY_B,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay
        ?.replayId,
      REPLAY_B,
    );
  },
);

test(
  "newer inventory refresh wins over stale earlier response",
  async () => {
    let resolveFirst:
      (
        value:
          GenesisReplayInventory,
      ) => void =
        () => {};

    let resolveSecond:
      (
        value:
          GenesisReplayInventory,
      ) => void =
        () => {};

    let call =
      0;

    const client:
      GenesisReplayReadClient = {
        listReplays() {
          call +=
            1;

          return new Promise<
            GenesisReplayInventory
          >(
            (
              resolve,
            ) => {
              if (
                call ===
                  1
              ) {
                resolveFirst =
                  resolve;
              } else {
                resolveSecond =
                  resolve;
              }
            },
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const first =
      adapter
        .refreshInventory();

    const second =
      adapter
        .refreshInventory();

    resolveSecond(
      inventory([
        REPLAY_B,
      ]),
    );

    await second;

    resolveFirst(
      inventory([
        REPLAY_A,
      ]),
    );

    await first;

    assert.deepEqual(
      adapter
        .getState()
        .inventory
        ?.replayIds,
      [
        REPLAY_B,
      ],
    );
  },
);

test(
  "clearSelection invalidates pending selection and clears selection-scoped error",
  async () => {
    let resolveStatus:
      (
        value:
          GenesisReplayStatusSnapshot,
      ) => void =
        () => {};

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        getReplayStatus() {
          return new Promise<
            GenesisReplayStatusSnapshot
          >(
            (
              resolve,
            ) => {
              resolveStatus =
                resolve;
            },
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const pending =
      adapter.selectReplay(
        REPLAY_A,
      );

    adapter
      .clearSelection();

    resolveStatus(
      status(
        REPLAY_A,
      ),
    );

    await pending;

    assert.equal(
      adapter
        .getState()
        .selectedReplayId,
      null,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay,
      null,
    );

    assert.equal(
      adapter
        .getState()
        .selectionLoading,
      false,
    );
  },
);

test(
  "subscription observes state changes and unsubscribe stops notifications",
  async () => {
    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory([
            REPLAY_A,
          ]);
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const observed:
      GenesisReplayInventory |
      null[] =
        [];

    let notifications =
      0;

    const unsubscribe =
      adapter.subscribe(
        (
          state,
        ) => {
          notifications +=
            1;

          void state;
        },
      );

    await adapter
      .refreshInventory();

    assert.ok(
      notifications >=
        2,
    );

    const before =
      notifications;

    unsubscribe();

    adapter
      .clearError();

    assert.equal(
      notifications,
      before,
    );

    void observed;
  },
);

test(
  "adapter performs no polling or automatic network work",
  async () => {
    let calls =
      0;

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          calls +=
            1;

          return inventory(
            [],
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          calls +=
            1;

          return status(
            replayId,
          );
        },
      };

    createGenesisReplayReadStateAdapter(
      client,
    );

    await new Promise(
      (
        resolve,
      ) =>
        setTimeout(
          resolve,
          10,
        ),
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "stale failed inventory request cannot overwrite newer successful inventory state",
  async () => {
    let rejectFirst:
      (
        reason?:
          unknown,
      ) => void =
        () => {};

    let resolveSecond:
      (
        value:
          GenesisReplayInventory,
      ) => void =
        () => {};

    let call =
      0;

    const client:
      GenesisReplayReadClient = {
        listReplays() {
          call +=
            1;

          if (
            call ===
              1
          ) {
            return new Promise<
              GenesisReplayInventory
            >(
              (
                _resolve,
                reject,
              ) => {
                rejectFirst =
                  reject;
              },
            );
          }

          return new Promise<
            GenesisReplayInventory
          >(
            (
              resolve,
            ) => {
              resolveSecond =
                resolve;
            },
          );
        },

        async getReplayStatus(
          replayId,
        ) {
          return status(
            replayId,
          );
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const first =
      adapter
        .refreshInventory();

    const second =
      adapter
        .refreshInventory();

    resolveSecond(
      inventory([
        REPLAY_B,
      ]),
    );

    await second;

    rejectFirst(
      new GenesisReplayReadApiError({
        status:
          409,

        code:
          "genesis_replay_inventory_corrupt_json",
      }),
    );

    await first;

    assert.deepEqual(
      adapter
        .getState()
        .inventory
        ?.replayIds,
      [
        REPLAY_B,
      ],
    );

    assert.equal(
      adapter
        .getState()
        .inventoryLoading,
      false,
    );

    assert.equal(
      adapter
        .getState()
        .inventoryLoaded,
      true,
    );

    assert.equal(
      adapter
        .getState()
        .error,
      null,
    );
  },
);

test(
  "stale failed selection request cannot overwrite newer successful selection state",
  async () => {
    let rejectA:
      (
        reason?:
          unknown,
      ) => void =
        () => {};

    let resolveB:
      (
        value:
          GenesisReplayStatusSnapshot,
      ) => void =
        () => {};

    const pendingA =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          _resolve,
          reject,
        ) => {
          rejectA =
            reject;
        },
      );

    const pendingB =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          resolve,
        ) => {
          resolveB =
            resolve;
        },
      );

    const client:
      GenesisReplayReadClient = {
        async listReplays() {
          return inventory(
            [],
          );
        },

        getReplayStatus(
          replayId,
        ) {
          return replayId ===
            REPLAY_A
            ? pendingA
            : pendingB;
        },
      };

    const adapter =
      createGenesisReplayReadStateAdapter(
        client,
      );

    const first =
      adapter.selectReplay(
        REPLAY_A,
      );

    const second =
      adapter.selectReplay(
        REPLAY_B,
      );

    resolveB(
      status(
        REPLAY_B,
      ),
    );

    await second;

    rejectA(
      new GenesisReplayReadApiError({
        status:
          404,

        code:
          "genesis_replay_not_found",

        replayId:
          REPLAY_A,
      }),
    );

    await first;

    assert.equal(
      adapter
        .getState()
        .selectedReplayId,
      REPLAY_B,
    );

    assert.equal(
      adapter
        .getState()
        .selectedReplay
        ?.replayId,
      REPLAY_B,
    );

    assert.equal(
      adapter
        .getState()
        .selectionLoading,
      false,
    );

    assert.equal(
      adapter
        .getState()
        .error,
      null,
    );
  },
);
