import {
  useSyncExternalStore,
} from "react";

import type {
  GenesisReplayId,
} from "./genesisReplayReadClient.js";

import type {
  GenesisOperationalReadController,
  GenesisOperationalReadSnapshot,
} from "./genesisOperationalReadController.js";

export interface GenesisOperationalReactStore {
  getSnapshot():
    GenesisOperationalReadSnapshot;

  getServerSnapshot():
    GenesisOperationalReadSnapshot;

  subscribe(
    listener:
      () => void,
  ):
    () => void;
}

export interface GenesisOperationalReactActions {
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

export interface GenesisOperationalReactBinding
  extends
    GenesisOperationalReactActions {
  snapshot:
    GenesisOperationalReadSnapshot;
}

export interface GenesisOperationalReactAdapter {
  store:
    GenesisOperationalReactStore;

  actions:
    GenesisOperationalReactActions;
}

export function createGenesisOperationalReactAdapter(
  controller:
    GenesisOperationalReadController,
): GenesisOperationalReactAdapter {
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
    GenesisOperationalReactStore = {
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
    GenesisOperationalReactActions = {
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

export function useGenesisOperationalRead(
  adapter:
    GenesisOperationalReactAdapter,
): GenesisOperationalReactBinding {
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
