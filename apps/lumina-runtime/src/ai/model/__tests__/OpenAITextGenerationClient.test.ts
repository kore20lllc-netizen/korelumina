import assert from "node:assert/strict";
import test from "node:test";

import {
  OpenAITextGenerationClient,
} from "../OpenAITextGenerationClient.js";

test(
  "returns generated text and selected model",
  async () => {
    const originalFetch =
      globalThis.fetch;

    const originalKey =
      process.env.OPENAI_API_KEY;

    process.env.OPENAI_API_KEY =
      "test-key";

    globalThis.fetch =
      (async (
        _input,
        init,
      ) => {
        assert.equal(
          init?.method,
          "POST",
        );

        const body =
          JSON.parse(
            String(
              init?.body,
            ),
          );

        assert.equal(
          body.model,
          "test-model",
        );

        assert.equal(
          body.input,
          "test prompt",
        );

        return new Response(
          JSON.stringify({
            output_text:
              "generated result",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );
      }) as typeof fetch;

    try {
      const client =
        new OpenAITextGenerationClient();

      const result =
        await client
          .generateText({
            prompt:
              "test prompt",

            model:
              "test-model",
          });

      assert.deepEqual(
        result,
        {
          text:
            "generated result",

          model:
            "test-model",
        },
      );
    } finally {
      globalThis.fetch =
        originalFetch;

      if (
        originalKey ===
        undefined
      ) {
        delete process.env
          .OPENAI_API_KEY;
      } else {
        process.env
          .OPENAI_API_KEY =
          originalKey;
      }
    }
  },
);

test(
  "requires OpenAI API key",
  async () => {
    const originalKey =
      process.env.OPENAI_API_KEY;

    delete process.env
      .OPENAI_API_KEY;

    try {
      const client =
        new OpenAITextGenerationClient();

      await assert.rejects(
        () =>
          client.generateText({
            prompt:
              "test",
          }),
        /missing_OPENAI_API_KEY/,
      );
    } finally {
      if (
        originalKey !==
        undefined
      ) {
        process.env
          .OPENAI_API_KEY =
          originalKey;
      }
    }
  },
);
