import type {
  GenesisOperationalProjection,
  GenesisOperationalReadClient,
} from "./genesisOperationalReadClient.js";

import type {
  GenesisReplayId,
} from "./genesisReplayReadClient.js";

export interface GenesisOperationalReadStateError {
  message:
    string;

  code:
    string | null;

  status:
    number | null;

  replayId:
    GenesisReplayId | null;
}

export interface GenesisOperationalReadState {
  replayId:
    GenesisReplayId | null;

  projection:
    GenesisOperationalProjection | null;

  loading:
    boolean;

  loaded:
    boolean;

  error:
    GenesisOperationalReadStateError | null;
}

export interface GenesisOperationalReadStateAdapter {
  getState():
    GenesisOperationalReadState;

  subscribe(
    listener:
      (
        state:
          GenesisOperationalReadState,
      ) => void,
  ):
    () => void;

  load(
    replayId:
      GenesisReplayId,
  ):
    Promise<void>;

  refresh():
    Promise<void>;

  clear():
    void;

  clearError():
    void;
}

interface TypedReadErrorLike {
  code?:
    unknown;

  status?:
    unknown;

  replayId?:
    unknown;
}

function initialState():
  GenesisOperationalReadState {
  return {
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
  };
}

function normalizeError(
  replayId:
    GenesisReplayId,

  error:
    unknown,
): GenesisOperationalReadStateError {
  if (
    error instanceof
      Error
  ) {
    const candidate =
      error as
        Error &
        TypedReadErrorLike;

    return {
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

      replayId:
        typeof candidate.replayId ===
          "string"
          ? candidate.replayId as
              GenesisReplayId
          : replayId,
    };
  }

  return {
    message:
      "genesis_operational_read_unknown_error",

    code:
      null,

    status:
      null,

    replayId,
  };
}

export function createGenesisOperationalReadStateAdapter(
  client:
    GenesisOperationalReadClient,
): GenesisOperationalReadStateAdapter {
  let state =
    initialState();

  let requestGeneration =
    0;

  const listeners =
    new Set<
      (
        state:
          GenesisOperationalReadState,
      ) => void
    >();

  function publish(
    patch:
      Partial<
        GenesisOperationalReadState
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

  async function load(
    replayId:
      GenesisReplayId,
  ):
    Promise<void> {
    const generation =
      ++requestGeneration;

    publish({
      replayId,

      projection:
        null,

      loading:
        true,

      loaded:
        false,

      error:
        null,
    });

    try {
      const projection =
        await client
          .getOperationalProjection(
            replayId,
          );

      if (
        generation !==
          requestGeneration ||
        state.replayId !==
          replayId
      ) {
        return;
      }

      publish({
        projection,

        loading:
          false,

        loaded:
          true,

        error:
          null,
      });
    } catch (
      error
    ) {
      if (
        generation !==
          requestGeneration ||
        state.replayId !==
          replayId
      ) {
        return;
      }

      publish({
        projection:
          null,

        loading:
          false,

        loaded:
          true,

        error:
          normalizeError(
            replayId,
            error,
          ),
      });
    }
  }

  async function refresh():
    Promise<void> {
    const replayId =
      state.replayId;

    if (
      replayId ===
        null
    ) {
      return;
    }

    await load(
      replayId,
    );
  }

  function clear() {
    requestGeneration +=
      1;

    state =
      initialState();

    for (
      const listener
      of listeners
    ) {
      listener(
        state,
      );
    }
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

    load,

    refresh,

    clear,

    clearError,
  };
}
