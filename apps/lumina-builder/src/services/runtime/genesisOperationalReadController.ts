import type {
  GenesisOperationalReadState,
  GenesisOperationalReadStateAdapter,
} from "./genesisOperationalReadState.js";

import type {
  GenesisReplayId,
} from "./genesisReplayReadClient.js";

import type {
  GenesisReplayReadController,
} from "./genesisReplayReadController.js";

import type {
  GenesisReplayReadViewModel,
} from "./genesisReplayReadViewModel.js";

export interface GenesisOperationalReadSnapshot {
  replay:
    GenesisReplayReadViewModel;

  operational:
    GenesisOperationalReadState;
}

export type GenesisOperationalReadControllerListener =
  (
    snapshot:
      GenesisOperationalReadSnapshot,
  ) => void;

export interface GenesisOperationalReadController {
  getSnapshot():
    GenesisOperationalReadSnapshot;

  subscribe(
    listener:
      GenesisOperationalReadControllerListener,
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

export function createGenesisOperationalReadController(
  replayController:
    GenesisReplayReadController,

  operationalState:
    GenesisOperationalReadStateAdapter,
): GenesisOperationalReadController {
  function getSnapshot():
    GenesisOperationalReadSnapshot {
    return {
      replay:
        replayController
          .getSnapshot(),

      operational:
        operationalState
          .getState(),
    };
  }

  function subscribe(
    listener:
      GenesisOperationalReadControllerListener,
  ):
    () => void {
    listener(
      getSnapshot(),
    );

    let suppressReplayInitial =
      true;

    const unsubscribeReplay =
      replayController.subscribe(
        () => {
          if (
            suppressReplayInitial
          ) {
            suppressReplayInitial =
              false;

            return;
          }

          listener(
            getSnapshot(),
          );
        },
      );

    suppressReplayInitial =
      false;

    const unsubscribeOperational =
      operationalState.subscribe(
        () => {
          listener(
            getSnapshot(),
          );
        },
      );

    return () => {
      unsubscribeReplay();
      unsubscribeOperational();
    };
  }

  async function selectReplay(
    replayId:
      GenesisReplayId,
  ):
    Promise<void> {
    await Promise.all([
      replayController
        .selectReplay(
          replayId,
        ),

      operationalState
        .load(
          replayId,
        ),
    ]);
  }

  async function refreshSelected():
    Promise<void> {
    await Promise.all([
      replayController
        .refreshSelected(),

      operationalState
        .refresh(),
    ]);
  }

  function clearSelection() {
    replayController
      .clearSelection();

    operationalState
      .clear();
  }

  function clearError() {
    replayController
      .clearError();

    operationalState
      .clearError();
  }

  return {
    getSnapshot,

    subscribe,

    refreshInventory:
      () =>
        replayController
          .refreshInventory(),

    selectReplay,

    refreshSelected,

    clearSelection,

    clearError,
  };
}
