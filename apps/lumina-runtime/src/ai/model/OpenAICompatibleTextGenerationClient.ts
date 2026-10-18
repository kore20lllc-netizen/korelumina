import type {
  TextGenerationClient,
  TextGenerationInput,
  TextGenerationResult,
} from "./TextGenerationClient.js";

/*
 * KO-5d (ADR-0041 Decision 9, F-15): any server that speaks the OpenAI
 * chat-completions format, such as Ollama, vLLM or a hosted open-weight
 * model. This is how an open model, and later KoreLumina's own fine-tuned
 * model, is plugged in.
 *
 * Configuration:
 *   LUMINA_OPENAI_COMPATIBLE_BASE_URL  e.g. http://127.0.0.1:11434/v1
 *   LUMINA_OPENAI_COMPATIBLE_MODEL     e.g. qwen2.5-coder:7b
 *   LUMINA_OPENAI_COMPATIBLE_API_KEY   optional
 */
export class OpenAICompatibleTextGenerationClient
  implements TextGenerationClient
{
  constructor(
    private readonly options: {
      baseUrl?:
        string;

      model?:
        string;
    } = {},
  ) {}

  async generateText(
    input:
      TextGenerationInput,
  ): Promise<TextGenerationResult> {
    const baseUrl =
      (
        this.options.baseUrl ??
        process.env.LUMINA_OPENAI_COMPATIBLE_BASE_URL ??
        ""
      )
        .trim()
        .replace(/\/+$/, "");

    if (!baseUrl) {
      throw new Error(
        "missing_LUMINA_OPENAI_COMPATIBLE_BASE_URL",
      );
    }

    const model =
      input.model ??
      this.options.model ??
      process.env.LUMINA_OPENAI_COMPATIBLE_MODEL;

    if (!model) {
      throw new Error(
        "missing_LUMINA_OPENAI_COMPATIBLE_MODEL",
      );
    }

    const apiKey =
      process.env.LUMINA_OPENAI_COMPATIBLE_API_KEY;

    const response =
      await fetch(
        `${baseUrl}/chat/completions`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...(apiKey
              ? {
                  Authorization:
                    `Bearer ${apiKey}`,
                }
              : {}),
          },

          body:
            JSON.stringify({
              model,
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
        choices?: Array<{
          message?: {
            content?: unknown;
          };
        }>;

        error?:
          | string
          | {
              message?: unknown;
            };
      };

    if (!response.ok) {
      const message =
        typeof data.error ===
          "string"
          ? data.error
          : typeof data.error?.message ===
              "string"
            ? data.error.message
            : "openai_compatible_request_failed";

      throw new Error(
        message,
      );
    }

    const text =
      data.choices?.at(0)?.message?.content;

    if (
      typeof text !==
        "string" ||
      !text
    ) {
      throw new Error(
        "openai_compatible_response_missing_text",
      );
    }

    return {
      text,
      model,
    };
  }
}
