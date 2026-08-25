import {
  accessSync,
  constants,
  realpathSync,
  statSync,
} from "node:fs";

import {
  buildGenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import type {
  GenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import {
  ChatGPTBrowserRecoverySource,
} from "./ChatGPTBrowserRecoverySource.js";

import {
  ChatGPTConversationExportSource,
} from "./ChatGPTConversationExportSource.js";

import {
  GenesisHistoricalConversationSourceAdapter,
} from "./GenesisHistoricalConversationSourceAdapter.js";

import type {
  GenesisHistoricalConversationSource,
} from "./GenesisHistoricalConversationSourceAdapter.js";


export const GENESIS_CHATGPT_EXPORT_ROOT_ENV =
  "KORELUMINA_GENESIS_CHATGPT_EXPORT_ROOT";


export const GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT_ENV =
  "KORELUMINA_GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT";


export type GenesisConversationRuntimeConfigurationState =
  | "UNCONFIGURED"
  | "CONFIGURED"
  | "UNAVAILABLE";


export type GenesisConversationRuntimeSourceKind =
  | "chatgpt-data-export"
  | "chatgpt-authenticated-browser";


export interface GenesisConversationRuntimeConfiguration {
  state:
    GenesisConversationRuntimeConfigurationState;

  sourceKind:
    GenesisConversationRuntimeSourceKind |
    null;

  configuredRoot:
    string | null;

  resolvedRoot:
    string | null;

  blocker:
    string | null;

  boundary:
    GenesisConversationSourceBoundary;

  source:
    GenesisHistoricalConversationSource |
    null;

  adapter:
    GenesisHistoricalConversationSourceAdapter |
    null;
}


function blockedBoundary(
  blocker:
    string,
): GenesisConversationSourceBoundary {
  return buildGenesisConversationSourceBoundary({
    compilerAvailable:
      true,

    compilerName:
      "conversation-compiler",

    governedKnowledgePathAvailable:
      true,

    acquisitionAvailable:
      false,

    acquisitionBlocker:
      blocker,
  });
}


function unavailable(
  input: {
    configuredRoot:
      string | null;

    blocker:
      string;
  },
): GenesisConversationRuntimeConfiguration {
  return {
    state:
      "UNAVAILABLE",

    sourceKind:
      null,

    configuredRoot:
      input.configuredRoot,

    resolvedRoot:
      null,

    blocker:
      input.blocker,

    boundary:
      blockedBoundary(
        input.blocker,
      ),

    source:
      null,

    adapter:
      null,
  };
}


function resolveReadableDirectory(
  configuredRoot:
    string,

  sourceLabel:
    string,
): {
  resolvedRoot:
    string;
} | {
  blocker:
    string;
} {
  try {
    const resolvedRoot =
      realpathSync(
        configuredRoot,
      );

    const info =
      statSync(
        resolvedRoot,
      );

    if (
      !info.isDirectory()
    ) {
      throw new Error(
        "configured path is not a directory",
      );
    }

    accessSync(
      resolvedRoot,
      constants.R_OK,
    );

    return {
      resolvedRoot,
    };
  } catch (
    error
  ) {
    return {
      blocker:
        `Configured ${sourceLabel} source is unavailable: ${
          error instanceof Error
            ? error.message
            : String(
                error,
              )
        }`,
    };
  }
}


export function resolveGenesisConversationRuntimeConfiguration(
  environment:
    NodeJS.ProcessEnv =
      process.env,
): GenesisConversationRuntimeConfiguration {
  const configuredExportRoot =
    environment[
      GENESIS_CHATGPT_EXPORT_ROOT_ENV
    ]
      ?.trim() ??
    "";

  const configuredBrowserRecoveryRoot =
    environment[
      GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT_ENV
    ]
      ?.trim() ??
    "";

  if (
    configuredExportRoot.length >
      0 &&
    configuredBrowserRecoveryRoot.length >
      0
  ) {
    const blocker =
      "Multiple Genesis conversation acquisition sources are configured. Configure exactly one source.";

    return unavailable({
      configuredRoot:
        null,

      blocker,
    });
  }

  if (
    configuredExportRoot.length ===
      0 &&
    configuredBrowserRecoveryRoot.length ===
      0
  ) {
    const blocker =
      `${GENESIS_CHATGPT_EXPORT_ROOT_ENV} or ${GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT_ENV} must be configured.`;

    return {
      state:
        "UNCONFIGURED",

      sourceKind:
        null,

      configuredRoot:
        null,

      resolvedRoot:
        null,

      blocker,

      boundary:
        blockedBoundary(
          blocker,
        ),

      source:
        null,

      adapter:
        null,
    };
  }

  if (
    configuredExportRoot.length >
      0
  ) {
    const resolved =
      resolveReadableDirectory(
        configuredExportRoot,
        "ChatGPT export",
      );

    if (
      "blocker" in
      resolved
    ) {
      return unavailable({
        configuredRoot:
          configuredExportRoot,

        blocker:
          resolved.blocker,
      });
    }

    const source =
      new ChatGPTConversationExportSource({
        exportRoot:
          resolved.resolvedRoot,

        sourceId:
          "runtime-chatgpt-data-export",
      });

    const adapter =
      new GenesisHistoricalConversationSourceAdapter({
        source,

        discovererId:
          "runtime-chatgpt-conversation-history-v1",
      });

    return {
      state:
        "CONFIGURED",

      sourceKind:
        "chatgpt-data-export",

      configuredRoot:
        configuredExportRoot,

      resolvedRoot:
        resolved.resolvedRoot,

      blocker:
        null,

      boundary:
        buildGenesisConversationSourceBoundary({
          compilerAvailable:
            true,

          compilerName:
            "conversation-compiler",

          governedKnowledgePathAvailable:
            true,

          acquisitionAvailable:
            true,

          acquisitionMechanism:
            "chatgpt-data-export",
        }),

      source,

      adapter,
    };
  }

  const resolved =
    resolveReadableDirectory(
      configuredBrowserRecoveryRoot,
      "ChatGPT browser recovery",
    );

  if (
    "blocker" in
    resolved
  ) {
    return unavailable({
      configuredRoot:
        configuredBrowserRecoveryRoot,

      blocker:
        resolved.blocker,
    });
  }

  const source =
    new ChatGPTBrowserRecoverySource({
      recoveryRoot:
        resolved.resolvedRoot,

      sourceId:
        "runtime-chatgpt-browser-recovery",
    });

  const adapter =
    new GenesisHistoricalConversationSourceAdapter({
      source,

      discovererId:
        "runtime-chatgpt-browser-conversation-history-v1",
    });

  return {
    state:
      "CONFIGURED",

    sourceKind:
      "chatgpt-authenticated-browser",

    configuredRoot:
      configuredBrowserRecoveryRoot,

    resolvedRoot:
      resolved.resolvedRoot,

    blocker:
      null,

    boundary:
      buildGenesisConversationSourceBoundary({
        compilerAvailable:
          true,

        compilerName:
          "conversation-compiler",

        governedKnowledgePathAvailable:
          true,

        acquisitionAvailable:
          true,

        acquisitionMechanism:
          "chatgpt-authenticated-browser",
      }),

    source,

    adapter,
  };
}
