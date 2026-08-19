import React from "react";

import {
  renderToString,
} from "react-dom/server";

import {
  useGenesisReplayRead,
} from "../useGenesisReplayRead";

export function runGenesisReplayReadHookContract() {
  function Probe() {
    const {
      snapshot,
      refreshInventory,
      selectReplay,
      refreshSelected,
      clearSelection,
      clearError,
    } =
      useGenesisReplayRead();

    return React.createElement(
      "div",
      {
        "data-loaded":
          String(
            snapshot
              .inventoryLoaded,
          ),

        "data-loading":
          String(
            snapshot
              .inventoryLoading,
          ),

        "data-count":
          String(
            snapshot
              .inventoryCount,
          ),

        "data-actions":
          [
            typeof refreshInventory,
            typeof selectReplay,
            typeof refreshSelected,
            typeof clearSelection,
            typeof clearError,
          ].join(
            ",",
          ),
      },
    );
  }

  const originalFetch =
    globalThis.fetch;

  let fetchCalls =
    0;

  globalThis.fetch =
    async () => {
      fetchCalls +=
        1;

      throw new Error(
        "unexpected_runtime_access",
      );
    };

  try {
    const html =
      renderToString(
        React.createElement(
          Probe,
        ),
      );

    if (
      fetchCalls !==
        0
    ) {
      throw new Error(
        `unexpected_runtime_access_count:${fetchCalls}`,
      );
    }

    if (
      !html.includes(
        'data-loaded="false"',
      )
    ) {
      throw new Error(
        "initial_loaded_state_invalid",
      );
    }

    if (
      !html.includes(
        'data-loading="false"',
      )
    ) {
      throw new Error(
        "initial_loading_state_invalid",
      );
    }

    if (
      !html.includes(
        'data-count="0"',
      )
    ) {
      throw new Error(
        "initial_inventory_count_invalid",
      );
    }

    if (
      !html.includes(
        'data-actions="function,function,function,function,function"',
      )
    ) {
      throw new Error(
        "hook_action_surface_invalid",
      );
    }

    return {
      html,
      fetchCalls,
    };
  } finally {
    globalThis.fetch =
      originalFetch;
  }
}
