import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisOperationalReadState,
  GenesisOperationalReadStateAdapter,
} from "../genesisOperationalReadState.js";

import type {
  GenesisReplayId,
} from "../genesisReplayReadClient.js";

import type {
  GenesisReplayReadController,
} from "../genesisReplayReadController.js";

import {
  createGenesisOperationalReadController,
} from "../genesisOperationalReadController.js";

const replayA =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const replayB =
  `genesis-replay:${"b".repeat(
    64,
  )}` as GenesisReplayId;

function replaySnapshot(
  replayId:
    GenesisReplayId | null =
      null,
) {
  return {
    inventory: {
      state:
        "ready",
      rows:
        [],
      empty:
        true,
    },

    selection: {
      replayId,
    },

    error:
      null,
  } as any;
}

function operationalState(
  replayId:
    GenesisReplayId | null =
      null,
): GenesisOperationalReadState {
  return {
    replayId,

    projection:
      null,

    loading:
      false,

    loaded:
      replayId !==
      null,

    error:
      null,
  };
}

function harness() {
  let replay =
    replaySnapshot();

  let operational =
    operationalState();

  const replayListeners =
    new Set<
      (
        value:
          any,
      ) => void
    >();

  const operationalListeners =
    new Set<
      (
        value:
          GenesisOperationalReadState,
      ) => void
    >();

  const calls = {
    refreshInventory:
      0,

    replaySelect:
      [] as GenesisReplayId[],

    operationalLoad:
      [] as GenesisReplayId[],

    replayRefresh:
      0,

    operationalRefresh:
      0,

    replayClearSelection:
      0,

    operationalClear:
      0,

    replayClearError:
      0,

    operationalClearError:
      0,
  };

  const replayController:
    GenesisReplayReadController = {
      getSnapshot:
        () =>
          replay,

      subscribe(
        listener,
      ) {
        replayListeners.add(
          listener,
        );

        listener(
          replay,
        );

        return () => {
          replayListeners.delete(
            listener,
          );
        };
      },

      async refreshInventory() {
        calls.refreshInventory +=
          1;
      },

      async selectReplay(
        replayId,
      ) {
        calls.replaySelect.push(
          replayId,
        );

        replay =
          replaySnapshot(
            replayId,
          );

        for (
          const listener
          of replayListeners
        ) {
          listener(
            replay,
          );
        }
      },

      async refreshSelected() {
        calls.replayRefresh +=
          1;
      },

      clearSelection() {
        calls.replayClearSelection +=
          1;

        replay =
          replaySnapshot();
      },

      clearError() {
        calls.replayClearError +=
          1;
      },
    };

  const state:
    GenesisOperationalReadStateAdapter = {
      getState:
        () =>
          operational,

      subscribe(
        listener,
      ) {
        operationalListeners.add(
          listener,
        );

        return () => {
          operationalListeners.delete(
            listener,
          );
        };
      },

      async load(
        replayId,
      ) {
        calls.operationalLoad.push(
          replayId,
        );

        operational =
          operationalState(
            replayId,
          );

        for (
          const listener
          of operationalListeners
        ) {
          listener(
            operational,
          );
        }
      },

      async refresh() {
        calls.operationalRefresh +=
          1;
      },

      clear() {
        calls.operationalClear +=
          1;

        operational =
          operationalState();
      },

      clearError() {
        calls.operationalClearError +=
          1;
      },
    };

  return {
    replayController,
    state,
    calls,

    emitReplay(
      replayId:
        GenesisReplayId,
    ) {
      replay =
        replaySnapshot(
          replayId,
        );

      for (
        const listener
        of replayListeners
      ) {
        listener(
          replay,
        );
      }
    },

    emitOperational(
      replayId:
        GenesisReplayId,
    ) {
      operational =
        operationalState(
          replayId,
        );

      for (
        const listener
        of operationalListeners
      ) {
        listener(
          operational,
        );
      }
    },
  };
}

test(
  "controller snapshot preserves replay and operational state independently",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      snapshot.replay,
      h.replayController
        .getSnapshot(),
    );

    assert.equal(
      snapshot.operational,
      h.state.getState(),
    );
  },
);

test(
  "selectReplay drives replay selection and operational load for same identity",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller
      .selectReplay(
        replayA,
      );

    assert.deepEqual(
      h.calls.replaySelect,
      [
        replayA,
      ],
    );

    assert.deepEqual(
      h.calls.operationalLoad,
      [
        replayA,
      ],
    );
  },
);

test(
  "selecting another replay drives both layers to new identity",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller
      .selectReplay(
        replayA,
      );

    await controller
      .selectReplay(
        replayB,
      );

    assert.deepEqual(
      h.calls.replaySelect,
      [
        replayA,
        replayB,
      ],
    );

    assert.deepEqual(
      h.calls.operationalLoad,
      [
        replayA,
        replayB,
      ],
    );
  },
);

test(
  "refreshSelected refreshes both replay and operational state",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller
      .refreshSelected();

    assert.equal(
      h.calls.replayRefresh,
      1,
    );

    assert.equal(
      h.calls.operationalRefresh,
      1,
    );
  },
);

test(
  "clearSelection clears replay and operational state together",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    controller.clearSelection();

    assert.equal(
      h.calls.replayClearSelection,
      1,
    );

    assert.equal(
      h.calls.operationalClear,
      1,
    );
  },
);

test(
  "clearError clears both independent error channels",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    controller.clearError();

    assert.equal(
      h.calls.replayClearError,
      1,
    );

    assert.equal(
      h.calls.operationalClearError,
      1,
    );
  },
);

test(
  "refreshInventory remains replay inventory responsibility",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller
      .refreshInventory();

    assert.equal(
      h.calls.refreshInventory,
      1,
    );

    assert.equal(
      h.calls.operationalRefresh,
      0,
    );
  },
);

test(
  "subscription publishes changes from either underlying read boundary",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
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

    const initial =
      notifications;

    h.emitReplay(
      replayA,
    );

    h.emitOperational(
      replayA,
    );

    assert.equal(
      notifications,
      initial +
        2,
    );

    unsubscribe();
  },
);

test(
  "unsubscribe detaches replay and operational subscriptions",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
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

    unsubscribe();

    const before =
      notifications;

    h.emitReplay(
      replayA,
    );

    h.emitOperational(
      replayA,
    );

    assert.equal(
      notifications,
      before,
    );
  },
);

test(
  "controller subscription delivers exactly one synchronous initial snapshot",
  () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
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
  },
);

test(
  "completed selection leaves replay and operational state aligned to same identity",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller.selectReplay(
      replayA,
    );

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      (
        snapshot.replay
          .selection as any
      ).replayId,
      replayA,
    );

    assert.equal(
      snapshot.operational
        .replayId,
      replayA,
    );
  },
);

test(
  "reselection leaves neither layer pointing at previous replay",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller.selectReplay(
      replayA,
    );

    await controller.selectReplay(
      replayB,
    );

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      (
        snapshot.replay
          .selection as any
      ).replayId,
      replayB,
    );

    assert.equal(
      snapshot.operational
        .replayId,
      replayB,
    );

    assert.notEqual(
      snapshot.operational
        .replayId,
      replayA,
    );
  },
);

test(
  "clearSelection leaves both composed read boundaries unselected",
  async () => {
    const h =
      harness();

    const controller =
      createGenesisOperationalReadController(
        h.replayController,
        h.state,
      );

    await controller.selectReplay(
      replayA,
    );

    controller.clearSelection();

    const snapshot =
      controller.getSnapshot();

    assert.equal(
      (
        snapshot.replay
          .selection as any
      ).replayId,
      null,
    );

    assert.equal(
      snapshot.operational
        .replayId,
      null,
    );

    assert.equal(
      snapshot.operational
        .projection,
      null,
    );
  },
);
