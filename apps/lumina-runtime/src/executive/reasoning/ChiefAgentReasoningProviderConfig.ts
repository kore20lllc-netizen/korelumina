import {
  AnthropicTextGenerationClient,
  OpenAICompatibleTextGenerationClient,
  OpenAITextGenerationClient,
  type TextGenerationClient,
} from "../../ai/model/index.js";

import type {
  ChiefAgentReasoningProvider,
} from "./ChiefAgentReasoningDestinationAdapter.js";

import {
  EscalatingChiefAgentReasoningProvider,
} from "./EscalatingChiefAgentReasoningProvider.js";

import {
  TextGenerationChiefAgentReasoningProvider,
} from "./TextGenerationChiefAgentReasoningProvider.js";

/*
 * KO-5d (ADR-0041 Decision 9, F-15): the reasoning provider is
 * configuration, not code. Defaults keep today's behaviour exactly:
 * OpenAI as primary, no escalation.
 *
 *   LUMINA_REASONING_PRIMARY               openai | anthropic | openai-compatible
 *   LUMINA_REASONING_PRIMARY_MODEL         optional model id
 *   LUMINA_REASONING_ESCALATION            none | openai | anthropic | openai-compatible
 *   LUMINA_REASONING_ESCALATION_MODEL      optional model id
 *   LUMINA_REASONING_ESCALATION_CONFIDENCE 0..1, default 0.6
 */

export const REASONING_PROVIDER_NAMES =
  [
    "openai",
    "anthropic",
    "openai-compatible",
  ] as const;

export interface ChiefAgentReasoningRoutingConfig {
  primary:
    string;

  primaryModel:
    string | null;

  escalation:
    string | null;

  escalationModel:
    string | null;

  confidenceThreshold:
    number;
}

function clean(
  value:
    string | undefined,
): string | null {
  const trimmed =
    value?.trim();

  return trimmed
    ? trimmed
    : null;
}

export function resolveChiefAgentReasoningRouting(
  env:
    NodeJS.ProcessEnv =
    process.env,
): ChiefAgentReasoningRoutingConfig {
  const escalation =
    clean(
      env.LUMINA_REASONING_ESCALATION,
    )?.toLowerCase() ??
    "none";

  const threshold =
    Number(
      env.LUMINA_REASONING_ESCALATION_CONFIDENCE,
    );

  return {
    primary:
      clean(
        env.LUMINA_REASONING_PRIMARY,
      )?.toLowerCase() ??
      "openai",

    primaryModel:
      clean(
        env.LUMINA_REASONING_PRIMARY_MODEL,
      ),

    escalation:
      escalation ===
        "none"
        ? null
        : escalation,

    escalationModel:
      clean(
        env.LUMINA_REASONING_ESCALATION_MODEL,
      ),

    confidenceThreshold:
      Number.isFinite(
        threshold,
      ) &&
      threshold >=
        0 &&
      threshold <=
        1
        ? threshold
        : 0.6,
  };
}

/*
 * An unknown provider name never crashes the Runtime: reasoning calls
 * fail visibly with the name, and the rest of the platform keeps running.
 */
export function createTextGenerationClient(
  name:
    string,
  model:
    string | null,
): TextGenerationClient {
  const pinned = (
    client:
      TextGenerationClient,
  ): TextGenerationClient =>
    model
      ? {
          generateText: (input) =>
            client.generateText({
              ...input,
              model:
                input.model ??
                model,
            }),
        }
      : client;

  switch (name) {
    case "openai":
      return pinned(
        new OpenAITextGenerationClient(),
      );

    case "anthropic":
      return pinned(
        new AnthropicTextGenerationClient(),
      );

    case "openai-compatible":
      return pinned(
        new OpenAICompatibleTextGenerationClient(),
      );

    default:
      return {
        generateText: async () => {
          throw new Error(
            `unsupported_reasoning_provider:${name}`,
          );
        },
      };
  }
}

export function createChiefAgentReasoningProvider(
  config:
    ChiefAgentReasoningRoutingConfig =
    resolveChiefAgentReasoningRouting(),
  makeClient:
    typeof createTextGenerationClient =
    createTextGenerationClient,
): ChiefAgentReasoningProvider {
  const primary =
    new TextGenerationChiefAgentReasoningProvider(
      makeClient(
        config.primary,
        config.primaryModel,
      ),
    );

  const escalation =
    config.escalation
      ? new TextGenerationChiefAgentReasoningProvider(
          makeClient(
            config.escalation,
            config.escalationModel,
          ),
        )
      : null;

  return new EscalatingChiefAgentReasoningProvider(
    {
      name:
        config.primary,
      provider:
        primary,
    },
    escalation
      ? {
          name:
            config.escalation!,
          provider:
            escalation,
        }
      : null,
    config.confidenceThreshold,
  );
}
