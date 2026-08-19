import type {
  GenesisReplayId,
  GenesisReplayReadClient,
} from "./genesisReplayReadClient.js";

import {
  createGenesisReplayReadStateAdapter,
} from "./genesisReplayReadState.js";

import {
  createGenesisReplayReadViewModel,
} from "./genesisReplayReadViewModel.js";

import type {
  GenesisReplayReadViewModel,
} from "./genesisReplayReadViewModel.js";

export type GenesisReplayReadControllerListener =
  (
    view:
      GenesisReplayReadViewModel,
  ) => void;

export interface GenesisReplayReadController {
  getSnapshot():
    GenesisReplayReadViewModel;

  subscribe(
    listener:
      GenesisReplayReadControllerListener,
  ):
    () => void;

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

export function createGenesisReplayReadController(
  client:
    GenesisReplayReadClient,
): GenesisReplayReadController {
  const state =
    createGenesisReplayReadStateAdapter(
      client,
    );

  function getSnapshot():
    GenesisReplayReadViewModel {
    return createGenesisReplayReadViewModel(
      state.getState(),
    );
  }

  function subscribe(
    listener:
      GenesisReplayReadControllerListener,
  ):
    () => void {
    /*
     * Immediate snapshot delivery is framework-neutral and
     * synchronous. It does not trigger runtime access.
     */
    listener(
      getSnapshot(),
    );

    return state.subscribe(
      (
        nextState,
      ) => {
        listener(
          createGenesisReplayReadViewModel(
            nextState,
          ),
        );
      },
    );
  }

  return {
    getSnapshot,

    subscribe,

    refreshInventory:
      () =>
        state.refreshInventory(),

    selectReplay:
      (
        replayId,
      ) =>
        state.selectReplay(
          replayId,
        ),

    refreshSelected:
      () =>
        state.refreshSelected(),

    clearSelection:
      () =>
        state.clearSelection(),

    clearError:
      () =>
        state.clearError(),
  };
}
