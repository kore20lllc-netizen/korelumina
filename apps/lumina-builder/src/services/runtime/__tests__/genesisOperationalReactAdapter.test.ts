import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisOperationalReadController,
  GenesisOperationalReadSnapshot,
} from "../genesisOperationalReadController.js";

import {
  createGenesisOperationalReactAdapter,
} from "../genesisOperationalReactAdapter.js";

const replayId =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

function snapshot(
  marker:
    string,
): GenesisOperationalReadSnapshot {
  return {
    replay: {
      marker,
    } as any,

    operational: {
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
  };
}

function harness() {
  let current =
    snapshot(
      "initial",
    );

  let controllerListener:
    (
      value:
        GenesisOperationalReadSnapshot,
    ) => void =
      () => {};

  let subscriptions =
    0;

  let unsubscriptions =
    0;

  const calls = {
    refreshInventory:
      0,

    selectReplay:
      0,

    refreshSelected:
      0,

    clearSelection:
      0,

    clearError:
      0,
  };

  const controller:
    GenesisOperationalReadController = {
      getSnapshot:
        () =>
          current,

      subscribe(
        listener,
      ) {
        subscriptions +=
          1;

        controllerListener =
          listener;

        listener(
          current,
        );

        return () => {
          unsubscriptions +=
            1;
        };
      },

      async refreshInventory() {
        calls.refreshInventory +=
          1;
      },

      async selectReplay() {
        calls.selectReplay +=
          1;
      },

      async refreshSelected() {
        calls.refreshSelected +=
          1;
      },

      clearSelection() {
        calls.clearSelection +=
          1;
      },

      clearError() {
        calls.clearError +=
          1;
      },
    };

  return {
    controller,
    calls,

    get subscriptions() {
      return subscriptions;
    },

    get unsubscriptions() {
      return unsubscriptions;
    },

    emit(
      marker:
        string,
    ) {
      current =
        snapshot(
          marker,
        );

      controllerListener(
        current,
      );
    },
  };
}

test(
  "React store returns stable cached snapshot before controller changes",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    const first =
      adapter.store
        .getSnapshot();

    const second =
      adapter.store
        .getSnapshot();

    assert.equal(
      first,
      second,
    );
  },
);

test(
  "first React subscriber connects controller once",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    const unsubscribe =
      adapter.store.subscribe(
        () => {},
      );

    assert.equal(
      h.subscriptions,
      1,
    );

    unsubscribe();
  },
);

test(
  "multiple React subscribers share one controller subscription",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    const a =
      adapter.store.subscribe(
        () => {},
      );

    const b =
      adapter.store.subscribe(
        () => {},
      );

    assert.equal(
      h.subscriptions,
      1,
    );

    a();
    b();

    assert.equal(
      h.unsubscriptions,
      1,
    );
  },
);

test(
  "controller changes update cached operational snapshot",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    let notifications =
      0;

    const unsubscribe =
      adapter.store.subscribe(
        () => {
          notifications +=
            1;
        },
      );

    h.emit(
      "changed",
    );

    assert.equal(
      (
        adapter.store
          .getSnapshot()
          .replay as any
      ).marker,
      "changed",
    );

    assert.equal(
      notifications,
      1,
    );

    unsubscribe();
  },
);

test(
  "synchronous initial controller delivery does not notify React",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    let notifications =
      0;

    const unsubscribe =
      adapter.store.subscribe(
        () => {
          notifications +=
            1;
        },
      );

    assert.equal(
      notifications,
      0,
    );

    unsubscribe();
  },
);

test(
  "React actions delegate to composed controller",
  async () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    await adapter.actions
      .refreshInventory();

    await adapter.actions
      .selectReplay(
        replayId,
      );

    await adapter.actions
      .refreshSelected();

    adapter.actions
      .clearSelection();

    adapter.actions
      .clearError();

    assert.deepEqual(
      h.calls,
      {
        refreshInventory:
          1,

        selectReplay:
          1,

        refreshSelected:
          1,

        clearSelection:
          1,

        clearError:
          1,
      },
    );
  },
);

test(
  "React adapter reconnects with freshest controller snapshot",
  () => {
    const h =
      harness();

    const adapter =
      createGenesisOperationalReactAdapter(
        h.controller,
      );

    const firstUnsubscribe =
      adapter.store.subscribe(
        () => {},
      );

    firstUnsubscribe();

    h.emit(
      "while-disconnected",
    );

    const secondUnsubscribe =
      adapter.store.subscribe(
        () => {},
      );

    assert.equal(
      (
        adapter.store
          .getSnapshot()
          .replay as any
      ).marker,
      "while-disconnected",
    );

    assert.equal(
      h.subscriptions,
      2,
    );

    secondUnsubscribe();

    assert.equal(
      h.unsubscriptions,
      2,
    );
  },
);
