import React from "react";

import {
  renderToString,
} from "react-dom/server";

import {
  GenesisReplayReadWorkspace,
} from "../GenesisReplayReadWorkspace";

import type {
  GenesisReplayReactBinding,
} from "@/services/runtime/genesisReplayRead";

import type {
  GenesisReplayId,
} from "@/services/runtime/genesisReplayRead";

declare global {
  var __GENESIS_REPLAY_TEST_BINDING__:
    GenesisReplayReactBinding |
    undefined;
}

const REPLAY_A =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

function actions() {
  return {
    refreshInventory:
      async () => {},

    selectReplay:
      async (
        _replayId:
          GenesisReplayId,
      ) => {},

    refreshSelected:
      async () => {},

    clearSelection:
      () => {},

    clearError:
      () => {},
  };
}

function renderWith(
  binding:
    GenesisReplayReactBinding,
) {
  globalThis
    .__GENESIS_REPLAY_TEST_BINDING__ =
    binding;

  return renderToString(
    React.createElement(
      GenesisReplayReadWorkspace,
    ),
  );
}

function normalizeSsrText(
  html:
    string,
) {
  return html
    .replace(
      /<!-- -->/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
}

function assertIncludes(
  html:
    string,

  values:
    readonly string[],
) {
  const normalized =
    normalizeSsrText(
      html,
    );

  for (
    const value
    of values
  ) {
    if (
      !normalized.includes(
        value,
      )
    ) {
      throw new Error(
        `workspace_contract_missing:${value}`,
      );
    }
  }
}

function assertExcludes(
  html:
    string,

  values:
    readonly string[],
) {
  const normalized =
    normalizeSsrText(
      html,
    );

  for (
    const value
    of values
  ) {
    if (
      normalized.includes(
        value,
      )
    ) {
      throw new Error(
        `workspace_contract_forbidden:${value}`,
      );
    }
  }
}

export function runGenesisReplayWorkspaceShellContract() {
  const originalFetch =
    globalThis.fetch;

  let fetchCalls =
    0;

  globalThis.fetch =
    async () => {
      fetchCalls +=
        1;

      throw new Error(
        "unexpected_genesis_runtime_access",
      );
    };

  try {
    const unloaded =
      renderWith({
        snapshot: {
          inventoryLoading:
            false,

          inventoryLoaded:
            false,

          inventoryEmpty:
            false,

          inventoryCount:
            0,

          rows:
            [],

          selectionLoading:
            false,

          selectedReplayId:
            null,

          selected:
            null,

          error:
            null,
        },

        ...actions(),
      });

    assertIncludes(
      unloaded,
      [
        "Genesis Replay Observatory",
        "Replay inventory",
        "Replay inspection",
        "Replay inventory has not been loaded",
        "Load replay inventory",
        "Select a replay",
      ],
    );

    const loadedEmpty =
      renderWith({
        snapshot: {
          inventoryLoading:
            false,

          inventoryLoaded:
            true,

          inventoryEmpty:
            true,

          inventoryCount:
            0,

          rows:
            [],

          selectionLoading:
            false,

          selectedReplayId:
            null,

          selected:
            null,

          error:
            null,
        },

        ...actions(),
      });

    assertIncludes(
      loadedEmpty,
      [
        "No persisted Genesis replays",
        "Refresh inventory",
      ],
    );

    assertExcludes(
      loadedEmpty,
      [
        "Replay inventory has not been loaded",
      ],
    );

    const row = {
      replayId:
        REPLAY_A,

      shortReplayId:
        "aaaaaaaa…aaaaaaaa",

      lifecycle:
        "Running" as const,

      lifecycleTone:
        "info" as const,

      manifestReadiness:
        "READY",

      manifestSources:
        4,

      executionPresent:
        true,

      progress: {
        available:
          true,

        total:
          4,

        completed:
          2,

        remaining:
          2,

        percent:
          50,

        admitted:
          1,

        skipped:
          1,

        rejected:
          0,
      },

      recovery: {
        eligible:
          true,

        reason:
          "ELIGIBLE",

        label:
          "Recovery eligible",

        tone:
          "warning" as const,
      },

      linkage: {
        health:
          "partial" as const,

        admittedEvidence:
          2,

        linkedEvidence:
          1,

        ambiguousEvidence:
          0,

        unlinkedEvidence:
          1,

        allLinked:
          false,

        label:
          "1 Evidence linkage unresolved",

        tone:
          "warning" as const,
      },

      selected:
        false,
    };

    const loadedInventory =
      renderWith({
        snapshot: {
          inventoryLoading:
            false,

          inventoryLoaded:
            true,

          inventoryEmpty:
            false,

          inventoryCount:
            1,

          rows: [
            row,
          ],

          selectionLoading:
            false,

          selectedReplayId:
            null,

          selected:
            null,

          error:
            null,
        },

        ...actions(),
      });

    assertIncludes(
      loadedInventory,
      [
        "1 replay",
        "aaaaaaaa…aaaaaaaa",
        "Running",
        "READY",
        "4 sources",
        "50%",
        "Recovery eligible",
        "1 Evidence linkage unresolved",
      ],
    );

    const selected =
      renderWith({
        snapshot: {
          inventoryLoading:
            false,

          inventoryLoaded:
            true,

          inventoryEmpty:
            false,

          inventoryCount:
            1,

          rows: [
            {
              ...row,
              selected:
                true,
            },
          ],

          selectionLoading:
            false,

          selectedReplayId:
            REPLAY_A,

          selected: {
            replayId:
              REPLAY_A,

            shortReplayId:
              "aaaaaaaa…aaaaaaaa",

            lifecycle:
              "Running",

            lifecycleTone:
              "info",

            manifestId:
              "genesis-manifest:fixture",

            manifestReadiness:
              "READY",

            manifestErrors:
              0,

            totalManifestSources:
              4,

            currentManifestIndex:
              1,

            currentHistoricalSourceId:
              "genesis-source:commit:fixture",

            runnerOutcome:
              null,

            runnerFailure:
              null,

            progress:
              row.progress,

            recovery:
              row.recovery,

            linkage:
              row.linkage,
          },

          error:
            null,
        },

        ...actions(),
      });

    assertIncludes(
      selected,
      [
        REPLAY_A,
        "Lifecycle",
        "Progress",
        "Recovery",
        "Linkage",
        "genesis-source:commit:fixture",
        "Clear selection",
      ],
    );

    const errored =
      renderWith({
        snapshot: {
          inventoryLoading:
            false,

          inventoryLoaded:
            false,

          inventoryEmpty:
            false,

          inventoryCount:
            0,

          rows:
            [],

          selectionLoading:
            false,

          selectedReplayId:
            null,

          selected:
            null,

          error: {
            scope:
              "inventory",

            message:
              "runtime_access_denied",

            code:
              "runtime_access_denied",

            status:
              403,

            label:
              "Replay inventory unavailable",

            tone:
              "danger",
          },
        },

        ...actions(),
      });

    assertIncludes(
      errored,
      [
        "Read integrity",
        "Replay inventory unavailable",
        "runtime_access_denied",
        "HTTP ",
        "403",
        "Clear error",
      ],
    );

    for (
      const html
      of [
        unloaded,
        loadedEmpty,
        loadedInventory,
        selected,
        errored,
      ]
    ) {
      assertExcludes(
        html,
        [
          "Start replay",
          "Resume replay",
          "Recover replay",
          "Delete replay",
          "Admit Evidence",
        ],
      );
    }

    if (
      fetchCalls !==
        0
    ) {
      throw new Error(
        `workspace_auto_read_detected:${fetchCalls}`,
      );
    }

    return {
      fetchCalls,
    };
  } finally {
    globalThis.fetch =
      originalFetch;

    delete globalThis
      .__GENESIS_REPLAY_TEST_BINDING__;
  }
}
