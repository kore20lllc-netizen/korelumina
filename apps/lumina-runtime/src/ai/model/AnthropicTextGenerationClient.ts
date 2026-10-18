import type {
  TextGenerationClient,
  TextGenerationInput,
  TextGenerationResult,
} from "./TextGenerationClient.js";

/*
 * KO-5d (ADR-0041 Decision 9, F-15): Claude through the Anthropic
 * Messages API. The key is read from the environment at call time and is
 * never logged or returned.
 */

const ANTHROPIC_MESSAGES_URL =
  "https://api.anthropic.com/v1/messages";

const ANTHROPIC_VERSION =
  "2023-06-01";

export class AnthropicTextGenerationClient
  implements TextGenerationClient
{
  constructor(
    private readonly options: {
      model?:
        string;

      maxTokens?:
        number;
    } = {},
  ) {}

  async generateText(
    input:
      TextGenerationInput,
  ): Promise<TextGenerationResult> {
    const apiKey =
      process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "missing_ANTHROPIC_API_KEY",
      );
    }

    const model =
      input.model ??
      this.options.model ??
      process.env.LUMINA_ANTHROPIC_MODEL ??
      "claude-sonnet-5-5";

    const response =
      await fetch(
        ANTHROPIC_MESSAGES_URL,
        {
          method:
            "POST",

          headers: {
            "x-api-key":
              apiKey,

            "anthropic-version":
              ANTHROPIC_VERSION,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model,
              max_tokens:
                this.options.maxTokens ??
                4096,
              messages: [
                {
                  role:
                    "user",
                  content:
                    input.prompt,
                },
              ],
            }),
        },
      );

    const data =
      (await response.json()) as {
        content?: Array<{
          type?: unknown;
          text?: unknown;
        }>;

        error?: {
          message?: unknown;
        };
      };

    if (!response.ok) {
      throw new Error(
        typeof data.error?.message ===
          "string"
          ? data.error.message
          : "anthropic_request_failed",
      );
    }

    const text =
      (data.content ?? [])
        .filter(
          (block) =>
            block.type ===
              "text" &&
            typeof block.text ===
              "string",
        )
        .map(
          (block) =>
            block.text as string,
        )
        .join("");

    if (!text) {
      throw new Error(
        "anthropic_response_missing_text",
      );
    }

    return {
      text,
      model,
    };
  }
}
