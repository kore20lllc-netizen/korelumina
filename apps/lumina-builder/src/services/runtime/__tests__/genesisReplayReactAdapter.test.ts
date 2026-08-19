import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayId,
} from "../genesisReplayReadClient.js";

import type {
  GenesisReplayReadController,
  GenesisReplayReadControllerListener,
} from "../genesisReplayReadController.js";

import type {
  GenesisReplayReadViewModel,
} from "../genesisReplayReadViewModel.js";

import {
  createGenesisReplayReactAdapter,
} from "../genesisReplayReactAdapter.js";

const REPLAY_A =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

function snapshot(
  input: {
    count?:
      number;

    selectedReplayId?:
      GenesisReplayId |
      null;

    loading?:
      boolean;
  } =
    {},
): GenesisReplayReadViewModel {
  return {
    inventoryLoading:
      input.loading ??
      false,

    inventoryLoaded:
      true,

    inventoryEmpty:
      (
        input.count ??
        0
      ) ===
      0,

    inventoryCount:
      input.count ??
      0,

    rows:
      [],

    selectionLoading:
      false,

    selectedReplayId:
      input.selectedReplayId ??
      null,

    selected:
      null,

    error:
      null,
  };
}

function controllerFixture() {
  let current =
    snapshot();

  const listeners =
    new Set<
      GenesisReplayReadControllerListener
    >();

  let subscribeCount =
    0;

  let unsubscribeCount =
    0;

  const actions = {
    refreshInventory:
      0,

    selectReplay:
      [] as GenesisReplayId[],

    refreshSelected:
      0,

    clearSelection:
      0,

    clearError:
      0,
  };

  const controller:
    GenesisReplayReadController = {
      getSnapshot() {
        return current;
      },

      subscribe(
        listener,
      ) {
        subscribeCount +=
          1;

        listeners.add(
          listener,
        );

        listener(
          current,
        );

        return () => {
          if (
            listeners.delete(
              listener,
            )
          ) {
            unsubscribeCount +=
              1;
          }
        };
      },

      async refreshInventory() {
        actions
          .refreshInventory +=
          1;
      },

      async selectReplay(
        replayId,
      ) {
        actions
          .selectReplay
          .push(
            replayId,
          );
      },

      async refreshSelected() {
        actions
          .refreshSelected +=
          1;
      },

      clearSelection() {
        actions
          .clearSelection +=
          1;
      },

      clearError() {
        actions
          .clearError +=
          1;
      },
    };

  return {
    controller,

    actions,

    subscribeCount() {
      return subscribeCount;
    },

    unsubscribeCount() {
      return unsubscribeCount;
    },

    publish(
      next:
        GenesisReplayReadViewModel,
    ) {
      current =
        next;

      for (
        const listener
        of listeners
      ) {
        listener(
          next,
        );
      }
    },

    replaceWhileDisconnected(
      next:
        GenesisReplayReadViewModel,
    ) {
      current =
        next;
    },
  };
}

test(
  "React adapter construction does not subscribe to controller",
  () => {
    const fixture =
      controllerFixture();

    createGenesisReplayReactAdapter(
      fixture.controller,
    );

    assert.equal(
      fixture.subscribeCount(),
      0,
    );
  },
);

test(
  "React store snapshot is referentially stable until controller publishes",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
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
  "first React subscriber lazily connects to controller exactly once",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    const unsubscribeA =
      adapter.store
        .subscribe(
          () => {},
        );

    assert.equal(
      fixture.subscribeCount(),
      1,
    );

    const unsubscribeB =
      adapter.store
        .subscribe(
          () => {},
        );

    assert.equal(
      fixture.subscribeCount(),
      1,
    );

    unsubscribeA();
    unsubscribeB();

    assert.equal(
      fixture.unsubscribeCount(),
      1,
    );
  },
);

test(
  "controller initial subscription delivery does not create synthetic React notification",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    let notifications =
      0;

    const unsubscribe =
      adapter.store
        .subscribe(
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
  "controller publication replaces cached snapshot and notifies React subscribers",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    let notifications =
      0;

    const unsubscribe =
      adapter.store
        .subscribe(
          () => {
            notifications +=
              1;
          },
        );

    const next =
      snapshot({
        count:
          3,
      });

    fixture.publish(
      next,
    );

    assert.equal(
      notifications,
      1,
    );

    assert.equal(
      adapter.store
        .getSnapshot(),
      next,
    );

    assert.equal(
      adapter.store
        .getServerSnapshot(),
      next,
    );

    unsubscribe();
  },
);

test(
  "unsubscribed React listener receives no later controller publication",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    let notifications =
      0;

    const unsubscribe =
      adapter.store
        .subscribe(
          () => {
            notifications +=
              1;
          },
        );

    unsubscribe();

    fixture.publish(
      snapshot({
        count:
          2,
      }),
    );

    assert.equal(
      notifications,
      0,
    );
  },
);

test(
  "adapter reconnects after all React subscribers detach",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    const first =
      adapter.store
        .subscribe(
          () => {},
        );

    first();

    assert.equal(
      fixture.subscribeCount(),
      1,
    );

    assert.equal(
      fixture.unsubscribeCount(),
      1,
    );

    const second =
      adapter.store
        .subscribe(
          () => {},
        );

    assert.equal(
      fixture.subscribeCount(),
      2,
    );

    second();

    assert.equal(
      fixture.unsubscribeCount(),
      2,
    );
  },
);

test(
  "React adapter actions delegate exactly to certified controller operations",
  async () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    await adapter.actions
      .refreshInventory();

    await adapter.actions
      .selectReplay(
        REPLAY_A,
      );

    await adapter.actions
      .refreshSelected();

    adapter.actions
      .clearSelection();

    adapter.actions
      .clearError();

    assert.deepEqual(
      fixture.actions,
      {
        refreshInventory:
          1,

        selectReplay: [
          REPLAY_A,
        ],

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
  "React adapter exposes no mutation action",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    assert.deepEqual(
      Object.keys(
        adapter.actions,
      ).sort(),
      [
        "clearError",
        "clearSelection",
        "refreshInventory",
        "refreshSelected",
        "selectReplay",
      ],
    );
  },
);

test(
  "reconnecting after controller changes while disconnected refreshes cached snapshot before React reads it",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    const initial =
      adapter.store
        .getSnapshot();

    assert.equal(
      initial.inventoryCount,
      0,
    );

    const firstUnsubscribe =
      adapter.store
        .subscribe(
          () => {},
        );

    firstUnsubscribe();

    assert.equal(
      fixture.unsubscribeCount(),
      1,
    );

    /*
     * Controller state changes while no React subscriber
     * is attached. The React adapter intentionally has no
     * active controller subscription at this point.
     */
    fixture.replaceWhileDisconnected(
      snapshot({
        count:
          7,

        selectedReplayId:
          REPLAY_A,
      }),
    );

    /*
     * Cache is expected to remain stale while disconnected.
     */
    assert.equal(
      adapter.store
        .getSnapshot()
        .inventoryCount,
      0,
    );

    let notifications =
      0;

    const secondUnsubscribe =
      adapter.store
        .subscribe(
          () => {
            notifications +=
              1;
          },
        );

    /*
     * controller.subscribe() synchronously publishes its
     * current snapshot during reconnection. The adapter
     * must consume that delivery into its cache before
     * subscribe() returns.
     */
    const reconnected =
      adapter.store
        .getSnapshot();

    assert.equal(
      fixture.subscribeCount(),
      2,
    );

    assert.equal(
      reconnected.inventoryCount,
      7,
    );

    assert.equal(
      reconnected.selectedReplayId,
      REPLAY_A,
    );

    /*
     * Reconciliation is not a synthetic external-store
     * change notification. React will read the refreshed
     * snapshot after subscription is established.
     */
    assert.equal(
      notifications,
      0,
    );

    secondUnsubscribe();

    assert.equal(
      fixture.unsubscribeCount(),
      2,
    );
  },
);

test(
  "controller publications after reconnection notify React from the reconciled baseline",
  () => {
    const fixture =
      controllerFixture();

    const adapter =
      createGenesisReplayReactAdapter(
        fixture.controller,
      );

    const first =
      adapter.store
        .subscribe(
          () => {},
        );

    first();

    fixture.replaceWhileDisconnected(
      snapshot({
        count:
          4,
      }),
    );

    let notifications =
      0;

    const second =
      adapter.store
        .subscribe(
          () => {
            notifications +=
              1;
          },
        );

    assert.equal(
      adapter.store
        .getSnapshot()
        .inventoryCount,
      4,
    );

    assert.equal(
      notifications,
      0,
    );

    const next =
      snapshot({
        count:
          5,
      });

    fixture.publish(
      next,
    );

    assert.equal(
      notifications,
      1,
    );

    assert.equal(
      adapter.store
        .getSnapshot(),
      next,
    );

    second();
  },
);
