import {
  useSyncExternalStore,
} from "react";

import type {
  GenesisReplayId,
} from "./genesisReplayReadClient.js";

import type {
  GenesisReplayReadController,
} from "./genesisReplayReadController.js";

import type {
  GenesisReplayReadViewModel,
} from "./genesisReplayReadViewModel.js";

export interface GenesisReplayReactStore {
  getSnapshot():
    GenesisReplayReadViewModel;

  getServerSnapshot():
    GenesisReplayReadViewModel;

  subscribe(
    listener:
      () => void,
  ):
    () => void;
}

export interface GenesisReplayReactActions {
  refreshInventory():
    Promise<void>;

  selectReplay(
    replayId:
      GenesisReplayId,
  ):
    Promise<void>;

  refreshSelected():
    Promise<void>;

  clearSelection():
    void;

  clearError():
    void;
}

export interface GenesisReplayReactBinding
  extends
    GenesisReplayReactActions {
  snapshot:
    GenesisReplayReadViewModel;
}

export interface GenesisReplayReactAdapter {
  store:
    GenesisReplayReactStore;

  actions:
    GenesisReplayReactActions;
}

export function createGenesisReplayReactAdapter(
  controller:
    GenesisReplayReadController,
): GenesisReplayReactAdapter {
  /*
   * React useSyncExternalStore requires getSnapshot()
   * to return the same object until the external store
   * actually changes.
   *
   * The framework-neutral controller intentionally
   * derives snapshots on demand, so this React bridge
   * owns a cached snapshot and updates it only when
   * controller subscription publishes state changes.
   */
  let snapshot =
    controller.getSnapshot();

  const listeners =
    new Set<
      () => void
    >();

  let unsubscribeController:
    (() => void) |
    null =
      null;

  function publish(
    next:
      GenesisReplayReadViewModel,
  ) {
    snapshot =
      next;

    for (
      const listener
      of listeners
    ) {
      listener();
    }
  }

  function connectController() {
    if (
      unsubscribeController !==
        null
    ) {
      return;
    }

    let synchronousInitialDelivery =
      true;

    unsubscribeController =
      controller.subscribe(
        (
          next,
        ) => {
          /*
           * Controller subscription immediately emits
           * its current snapshot. The adapter already
           * captured that state during construction, so
           * do not notify React for that initial delivery.
           */
          snapshot =
            next;

          if (
            synchronousInitialDelivery
          ) {
            return;
          }

          for (
            const listener
            of listeners
          ) {
            listener();
          }
        },
      );

    synchronousInitialDelivery =
      false;
  }

  function disconnectController() {
    if (
      unsubscribeController ===
        null
    ) {
      return;
    }

    unsubscribeController();

    unsubscribeController =
      null;
  }

  const store:
    GenesisReplayReactStore = {
      getSnapshot() {
        return snapshot;
      },

      getServerSnapshot() {
        return snapshot;
      },

      subscribe(
        listener,
      ) {
        listeners.add(
          listener,
        );

        if (
          listeners.size ===
            1
        ) {
          connectController();
        }

        return () => {
          listeners.delete(
            listener,
          );

          if (
            listeners.size ===
              0
          ) {
            disconnectController();
          }
        };
      },
  };

  const actions:
    GenesisReplayReactActions = {
      refreshInventory:
        () =>
          controller
            .refreshInventory(),

      selectReplay:
        (
          replayId,
        ) =>
          controller
            .selectReplay(
              replayId,
            ),

      refreshSelected:
        () =>
          controller
            .refreshSelected(),

      clearSelection:
        () =>
          controller
            .clearSelection(),

      clearError:
        () =>
          controller
            .clearError(),
  };

  return {
    store,
    actions,
  };
}

export function useGenesisReplayRead(
  adapter:
    GenesisReplayReactAdapter,
): GenesisReplayReactBinding {
  const snapshot =
    useSyncExternalStore(
      adapter.store.subscribe,
      adapter.store.getSnapshot,
      adapter.store.getServerSnapshot,
    );

  return {
    snapshot,

    refreshInventory:
      adapter.actions
        .refreshInventory,

    selectReplay:
      adapter.actions
        .selectReplay,

    refreshSelected:
      adapter.actions
        .refreshSelected,

    clearSelection:
      adapter.actions
        .clearSelection,

    clearError:
      adapter.actions
        .clearError,
  };
}
