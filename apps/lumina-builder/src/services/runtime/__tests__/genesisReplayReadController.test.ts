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
  createGenesisReplayReadController,
} from "../genesisReplayReadController.js";

const REPLAY_A =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const REPLAY_B =
  `genesis-replay:${"b".repeat(
    64,
  )}` as GenesisReplayId;

function replay(
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
      "genesis-manifest:controller-fixture",

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    totalManifestSources:
      2,

    executionStatus:
      "running",

    corpusStatus:
      "INCOMPLETE",

    currentManifestIndex:
      0,

    currentHistoricalSourceId:
      "genesis-source:commit:controller",

    lastCompletedManifestIndex:
      null,

    progress: {
      totalSources:
        2,

      completedSources:
        1,

      admittedSources:
        1,

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
          replay(
            replayId,
          ),
      ),
  };
}

test(
  "controller construction performs no network work",
  () => {
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

          return replay(
            replayId,
          );
        },
      };

    createGenesisReplayReadController(
      client,
    );

    assert.equal(
      calls,
      0,
    );
  },
);

test(
  "controller initial snapshot is derived from certified empty read state",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      snapshot.inventoryLoading,
      false,
    );

    assert.equal(
      snapshot.inventoryLoaded,
      false,
    );

    assert.equal(
      snapshot.inventoryEmpty,
      false,
    );

    assert.equal(
      snapshot.inventoryCount,
      0,
    );

    assert.deepEqual(
      snapshot.rows,
      [],
    );

    assert.equal(
      snapshot.selected,
      null,
    );
  },
);

test(
  "subscription immediately publishes current snapshot without network access",
  () => {
    let calls =
      0;

    let notifications =
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

          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const unsubscribe =
      controller.subscribe(
        (
          snapshot,
        ) => {
          notifications +=
            1;

          assert.equal(
            snapshot.inventoryLoaded,
            false,
          );
        },
      );

    assert.equal(
      notifications,
      1,
    );

    assert.equal(
      calls,
      0,
    );

    unsubscribe();
  },
);

test(
  "explicit inventory refresh publishes loading and resolved view-model snapshots",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const observed:
      {
        loading:
          boolean;

        loaded:
          boolean;

        count:
          number;
      }[] =
        [];

    const unsubscribe =
      controller.subscribe(
        (
          snapshot,
        ) => {
          observed.push({
            loading:
              snapshot
                .inventoryLoading,

            loaded:
              snapshot
                .inventoryLoaded,

            count:
              snapshot
                .inventoryCount,
          });
        },
      );

    const refresh =
      controller
        .refreshInventory();

    assert.equal(
      controller
        .getSnapshot()
        .inventoryLoading,
      true,
    );

    resolveInventory(
      inventory([
        REPLAY_A,
        REPLAY_B,
      ]),
    );

    await refresh;

    assert.equal(
      controller
        .getSnapshot()
        .inventoryCount,
      2,
    );

    assert.deepEqual(
      controller
        .getSnapshot()
        .rows
        .map(
          (
            row,
          ) =>
            row.replayId,
        ),
      [
        REPLAY_A,
        REPLAY_B,
      ],
    );

    assert.ok(
      observed.some(
        (
          item,
        ) =>
          item.loading,
      ),
    );

    assert.ok(
      observed.some(
        (
          item,
        ) =>
          item.loaded &&
          item.count ===
            2,
      ),
    );

    unsubscribe();
  },
);

test(
  "explicit replay selection publishes presentation-ready selected replay",
  async () => {
    const requested:
      GenesisReplayId[] =
        [];

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
          requested.push(
            replayId,
          );

          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    await controller
      .selectReplay(
        REPLAY_A,
      );

    const snapshot =
      controller.getSnapshot();

    assert.deepEqual(
      requested,
      [
        REPLAY_A,
      ],
    );

    assert.equal(
      snapshot.selectedReplayId,
      REPLAY_A,
    );

    assert.equal(
      snapshot.selected
        ?.replayId,
      REPLAY_A,
    );

    assert.equal(
      snapshot.selected
        ?.lifecycle,
      "Running",
    );

    assert.equal(
      snapshot.selected
        ?.progress
        .percent,
      50,
    );
  },
);

test(
  "refreshSelected delegates only when a Replay Identity is selected",
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

          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    await controller
      .refreshSelected();

    assert.deepEqual(
      requested,
      [],
    );

    await controller
      .selectReplay(
        REPLAY_A,
      );

    await controller
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
  "clearSelection immediately clears selected presentation state",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    await controller
      .selectReplay(
        REPLAY_A,
      );

    controller
      .clearSelection();

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      snapshot.selectedReplayId,
      null,
    );

    assert.equal(
      snapshot.selected,
      null,
    );

    assert.equal(
      snapshot.selectionLoading,
      false,
    );
  },
);

test(
  "controller preserves typed read errors through presentation layer",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    await controller
      .refreshInventory();

    assert.deepEqual(
      controller
        .getSnapshot()
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

        label:
          "Replay inventory unavailable",

        tone:
          "danger",
      },
    );

    controller
      .clearError();

    assert.equal(
      controller
        .getSnapshot()
        .error,
      null,
    );
  },
);

test(
  "unsubscribe prevents subsequent controller notifications",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    let notifications =
      0;

    const unsubscribe =
      controller.subscribe(
        () => {
          notifications +=
            1;
        },
      );

    assert.equal(
      notifications,
      1,
    );

    unsubscribe();

    await controller
      .refreshInventory();

    assert.equal(
      notifications,
      1,
    );
  },
);

test(
  "controller public surface contains read operations only",
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
          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    assert.deepEqual(
      Object.keys(
        controller,
      ).sort(),
      [
        "clearError",
        "clearSelection",
        "getSnapshot",
        "refreshInventory",
        "refreshSelected",
        "selectReplay",
        "subscribe",
      ],
    );
  },
);

test(
  "controller performs no polling or scheduled network access",
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

          return replay(
            replayId,
          );
        },
      };

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const unsubscribe =
      controller.subscribe(
        () => {},
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

    unsubscribe();
  },
);

test(
  "controller clearSelection remains authoritative when pending selection later succeeds",
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

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const selection =
      controller.selectReplay(
        REPLAY_A,
      );

    assert.equal(
      controller
        .getSnapshot()
        .selectedReplayId,
      REPLAY_A,
    );

    assert.equal(
      controller
        .getSnapshot()
        .selectionLoading,
      true,
    );

    controller
      .clearSelection();

    assert.equal(
      controller
        .getSnapshot()
        .selectedReplayId,
      null,
    );

    assert.equal(
      controller
        .getSnapshot()
        .selected,
      null,
    );

    assert.equal(
      controller
        .getSnapshot()
        .selectionLoading,
      false,
    );

    resolveStatus(
      replay(
        REPLAY_A,
      ),
    );

    await selection;

    const finalSnapshot =
      controller.getSnapshot();

    assert.equal(
      finalSnapshot
        .selectedReplayId,
      null,
    );

    assert.equal(
      finalSnapshot.selected,
      null,
    );

    assert.equal(
      finalSnapshot
        .selectionLoading,
      false,
    );

    assert.equal(
      finalSnapshot.error,
      null,
    );
  },
);

test(
  "controller clearSelection remains authoritative when pending selection later fails",
  async () => {
    let rejectStatus:
      (
        reason?:
          unknown,
      ) => void =
        () => {};

    const pending =
      new Promise<
        GenesisReplayStatusSnapshot
      >(
        (
          _resolve,
          reject,
        ) => {
          rejectStatus =
            reject;
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

    const controller =
      createGenesisReplayReadController(
        client,
      );

    const selection =
      controller.selectReplay(
        REPLAY_A,
      );

    controller
      .clearSelection();

    rejectStatus(
      new GenesisReplayReadApiError({
        status:
          404,

        code:
          "genesis_replay_not_found",

        replayId:
          REPLAY_A,
      }),
    );

    await selection;

    const finalSnapshot =
      controller.getSnapshot();

    assert.equal(
      finalSnapshot
        .selectedReplayId,
      null,
    );

    assert.equal(
      finalSnapshot.selected,
      null,
    );

    assert.equal(
      finalSnapshot
        .selectionLoading,
      false,
    );

    assert.equal(
      finalSnapshot.error,
      null,
    );
  },
);
