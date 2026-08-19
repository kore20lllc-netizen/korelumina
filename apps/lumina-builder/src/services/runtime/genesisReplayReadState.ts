import type {
  GenesisReplayId,
  GenesisReplayInventory,
  GenesisReplayReadClient,
  GenesisReplayStatusSnapshot,
} from "./genesisReplayReadClient.js";

export type GenesisReplayReadStateErrorScope =
  | "inventory"
  | "selection";

export interface GenesisReplayReadStateError {
  scope:
    GenesisReplayReadStateErrorScope;

  message:
    string;

  code:
    string | null;

  status:
    number | null;
}

export interface GenesisReplayReadState {
  inventory:
    GenesisReplayInventory | null;

  inventoryLoading:
    boolean;

  inventoryLoaded:
    boolean;

  selectedReplayId:
    GenesisReplayId | null;

  selectedReplay:
    GenesisReplayStatusSnapshot | null;

  selectionLoading:
    boolean;

  error:
    GenesisReplayReadStateError | null;
}

export interface GenesisReplayReadStateAdapter {
  getState():
    GenesisReplayReadState;

  subscribe(
    listener:
      (
        state:
          GenesisReplayReadState,
      ) => void,
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

interface TypedReadErrorLike {
  code?:
    unknown;

  status?:
    unknown;

  message?:
    unknown;
}

function normalizeError(
  scope:
    GenesisReplayReadStateErrorScope,

  error:
    unknown,
): GenesisReplayReadStateError {
  if (
    error instanceof
      Error
  ) {
    const candidate =
      error as
        Error &
        TypedReadErrorLike;

    return {
      scope,

      message:
        error.message,

      code:
        typeof candidate.code ===
          "string"
          ? candidate.code
          : null,

      status:
        typeof candidate.status ===
          "number"
          ? candidate.status
          : null,
    };
  }

  return {
    scope,

    message:
      "genesis_replay_read_unknown_error",

    code:
      null,

    status:
      null,
  };
}

function initialState():
  GenesisReplayReadState {
  return {
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
  };
}

export function createGenesisReplayReadStateAdapter(
  client:
    GenesisReplayReadClient,
): GenesisReplayReadStateAdapter {
  let state =
    initialState();

  const listeners =
    new Set<
      (
        state:
          GenesisReplayReadState,
      ) => void
    >();

  let inventoryRequestGeneration =
    0;

  let selectionRequestGeneration =
    0;

  function publish(
    patch:
      Partial<
        GenesisReplayReadState
      >,
  ) {
    state = {
      ...state,
      ...patch,
    };

    for (
      const listener
      of listeners
    ) {
      listener(
        state,
      );
    }
  }

  async function refreshInventory():
    Promise<void> {
    const generation =
      ++inventoryRequestGeneration;

    publish({
      inventoryLoading:
        true,

      error:
        state.error?.scope ===
          "inventory"
          ? null
          : state.error,
    });

    try {
      const inventory =
        await client
          .listReplays();

      if (
        generation !==
          inventoryRequestGeneration
      ) {
        return;
      }

      publish({
        inventory,

        inventoryLoading:
          false,

        inventoryLoaded:
          true,

        error:
          state.error?.scope ===
            "inventory"
            ? null
            : state.error,
      });
    } catch (
      error
    ) {
      if (
        generation !==
          inventoryRequestGeneration
      ) {
        return;
      }

      publish({
        inventoryLoading:
          false,

        inventoryLoaded:
          true,

        error:
          normalizeError(
            "inventory",
            error,
          ),
      });
    }
  }

  async function selectReplay(
    replayId:
      GenesisReplayId,
  ):
    Promise<void> {
    const generation =
      ++selectionRequestGeneration;

    publish({
      selectedReplayId:
        replayId,

      selectedReplay:
        null,

      selectionLoading:
        true,

      error:
        state.error?.scope ===
          "selection"
          ? null
          : state.error,
    });

    try {
      const selectedReplay =
        await client
          .getReplayStatus(
            replayId,
          );

      if (
        generation !==
          selectionRequestGeneration ||
        state.selectedReplayId !==
          replayId
      ) {
        return;
      }

      publish({
        selectedReplay,

        selectionLoading:
          false,

        error:
          state.error?.scope ===
            "selection"
            ? null
            : state.error,
      });
    } catch (
      error
    ) {
      if (
        generation !==
          selectionRequestGeneration ||
        state.selectedReplayId !==
          replayId
      ) {
        return;
      }

      publish({
        selectedReplay:
          null,

        selectionLoading:
          false,

        error:
          normalizeError(
            "selection",
            error,
          ),
      });
    }
  }

  async function refreshSelected():
    Promise<void> {
    const replayId =
      state.selectedReplayId;

    if (
      replayId ===
        null
    ) {
      return;
    }

    await selectReplay(
      replayId,
    );
  }

  function clearSelection() {
    selectionRequestGeneration +=
      1;

    publish({
      selectedReplayId:
        null,

      selectedReplay:
        null,

      selectionLoading:
        false,

      error:
        state.error?.scope ===
          "selection"
          ? null
          : state.error,
    });
  }

  function clearError() {
    if (
      state.error ===
        null
    ) {
      return;
    }

    publish({
      error:
        null,
    });
  }

  return {
    getState() {
      return state;
    },

    subscribe(
      listener,
    ) {
      listeners.add(
        listener,
      );

      return () => {
        listeners.delete(
          listener,
        );
      };
    },

    refreshInventory,

    selectReplay,

    refreshSelected,

    clearSelection,

    clearError,
  };
}
