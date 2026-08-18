import type {
  TextGenerationClient,
  TextGenerationInput,
  TextGenerationResult,
} from "./TextGenerationClient.js";

const OPENAI_RESPONSES_URL =
  "https://api.openai.com/v1/responses";

const DEFAULT_MODEL =
  process.env.LUMINA_OPENAI_MODEL ??
  process.env.OPENAI_MODEL ??
  "gpt-5.5";

function extractOutputText(
  data: unknown,
): string {
  const response =
    data as {
      output_text?: unknown;

      output?: Array<{
        content?: Array<{
          text?: unknown;
        }>;
      }>;
    };

  if (
    typeof response.output_text ===
    "string"
  ) {
    return response.output_text;
  }

  const output =
    Array.isArray(response.output)
      ? response.output
      : [];

  for (
    const item
    of output
  ) {
    const content =
      Array.isArray(item.content)
        ? item.content
        : [];

    for (
      const block
      of content
    ) {
      if (
        typeof block.text ===
        "string"
      ) {
        return block.text;
      }
    }
  }

  throw new Error(
    "openai_response_missing_text",
  );
}

export class OpenAITextGenerationClient
  implements TextGenerationClient
{
  async generateText(
    input:
      TextGenerationInput,
  ): Promise<TextGenerationResult> {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (
      !apiKey
    ) {
      throw new Error(
        "missing_OPENAI_API_KEY",
      );
    }

    const model =
      input.model ??
      DEFAULT_MODEL;

    const response =
      await fetch(
        OPENAI_RESPONSES_URL,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model,
              input:
                input.prompt,
            }),
        },
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      const failure =
        data as {
          error?:
            | string
            | {
                message?: string;
              };
        };

      throw new Error(
        typeof failure.error ===
        "object"
          ? failure.error
              ?.message ??
            "openai_request_failed"
          : failure.error ??
            "openai_request_failed",
      );
    }

    return {
      text:
        extractOutputText(
          data,
        ),

      model,
    };
  }
}
