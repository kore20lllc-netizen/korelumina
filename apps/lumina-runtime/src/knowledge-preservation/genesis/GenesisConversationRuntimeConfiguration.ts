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
  ChatGPTConversationExportSource,
} from "./ChatGPTConversationExportSource.js";

import {
  GenesisHistoricalConversationSourceAdapter,
} from "./GenesisHistoricalConversationSourceAdapter.js";


export const GENESIS_CHATGPT_EXPORT_ROOT_ENV =
  "KORELUMINA_GENESIS_CHATGPT_EXPORT_ROOT";


export type GenesisConversationRuntimeConfigurationState =
  | "UNCONFIGURED"
  | "CONFIGURED"
  | "UNAVAILABLE";


export interface GenesisConversationRuntimeConfiguration {
  state:
    GenesisConversationRuntimeConfigurationState;

  configuredRoot:
    string | null;

  resolvedRoot:
    string | null;

  blocker:
    string | null;

  boundary:
    GenesisConversationSourceBoundary;

  source:
    ChatGPTConversationExportSource |
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


export function resolveGenesisConversationRuntimeConfiguration(
  environment:
    NodeJS.ProcessEnv =
      process.env,
): GenesisConversationRuntimeConfiguration {
  const configuredRoot =
    environment[
      GENESIS_CHATGPT_EXPORT_ROOT_ENV
    ]
      ?.trim() ??
    "";

  if (
    configuredRoot.length ===
    0
  ) {
    const blocker =
      `${GENESIS_CHATGPT_EXPORT_ROOT_ENV} is not configured.`;

    return {
      state:
        "UNCONFIGURED",

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

  let resolvedRoot:
    string;

  try {
    resolvedRoot =
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
  } catch (
    error
  ) {
    const blocker =
      `Configured ChatGPT export source is unavailable: ${
        error instanceof Error
          ? error.message
          : String(
              error,
            )
      }`;

    return {
      state:
        "UNAVAILABLE",

      configuredRoot,

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

  const source =
    new ChatGPTConversationExportSource({
      exportRoot:
        resolvedRoot,

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

    configuredRoot,

    resolvedRoot,

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
