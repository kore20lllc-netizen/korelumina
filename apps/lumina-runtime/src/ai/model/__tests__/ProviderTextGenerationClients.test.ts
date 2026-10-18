import assert from "node:assert/strict";
import test from "node:test";

import {
  AnthropicTextGenerationClient,
  OpenAICompatibleTextGenerationClient,
} from "../index.js";

async function withFetch<T>(
  fake: typeof fetch,
  env: Record<string, string | undefined>,
  run: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  globalThis.fetch = fake;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test(
  "Anthropic client sends a Messages request and returns the text",
  async () => {
    const result = await withFetch(
      (async (url: string, init: RequestInit) => {
        assert.equal(url, "https://api.anthropic.com/v1/messages");
        const headers = init.headers as Record<string, string>;
        assert.equal(headers["x-api-key"], "test-key");
        assert.equal(headers["anthropic-version"], "2023-06-01");
        const body = JSON.parse(String(init.body));
        assert.equal(body.model, "claude-test");
        assert.deepEqual(body.messages, [{ role: "user", content: "hello" }]);
        return json(200, { content: [{ type: "text", text: "hi " }, { type: "text", text: "there" }] });
      }) as typeof fetch,
      { ANTHROPIC_API_KEY: "test-key" },
      () => new AnthropicTextGenerationClient({ model: "claude-test" }).generateText({ prompt: "hello" }),
    );

    assert.deepEqual(result, { text: "hi there", model: "claude-test" });
  },
);

test(
  "Anthropic client requires its key and surfaces API errors",
  async () => {
    await withFetch(
      (async () => json(200, {})) as typeof fetch,
      { ANTHROPIC_API_KEY: undefined },
      async () => {
        await assert.rejects(new AnthropicTextGenerationClient().generateText({ prompt: "x" }), { message: "missing_ANTHROPIC_API_KEY" });
      },
    );

    await withFetch(
      (async () => json(429, { error: { message: "rate_limited" } })) as typeof fetch,
      { ANTHROPIC_API_KEY: "k" },
      async () => {
        await assert.rejects(new AnthropicTextGenerationClient().generateText({ prompt: "x" }), { message: "rate_limited" });
      },
    );
  },
);

test(
  "OpenAI-compatible client calls the configured server and model",
  async () => {
    const result = await withFetch(
      (async (url: string, init: RequestInit) => {
        assert.equal(url, "http://127.0.0.1:11434/v1/chat/completions");
        const headers = init.headers as Record<string, string>;
        assert.equal(headers.Authorization, undefined, "no key header when no key is set");
        assert.equal(JSON.parse(String(init.body)).model, "qwen2.5-coder:7b");
        return json(200, { choices: [{ message: { content: "answer" } }] });
      }) as typeof fetch,
      {
        LUMINA_OPENAI_COMPATIBLE_BASE_URL: "http://127.0.0.1:11434/v1/",
        LUMINA_OPENAI_COMPATIBLE_MODEL: "qwen2.5-coder:7b",
        LUMINA_OPENAI_COMPATIBLE_API_KEY: undefined,
      },
      () => new OpenAICompatibleTextGenerationClient().generateText({ prompt: "q" }),
    );

    assert.deepEqual(result, { text: "answer", model: "qwen2.5-coder:7b" });
  },
);

test(
  "OpenAI-compatible client requires a server and a model",
  async () => {
    await withFetch(
      (async () => json(200, {})) as typeof fetch,
      { LUMINA_OPENAI_COMPATIBLE_BASE_URL: undefined, LUMINA_OPENAI_COMPATIBLE_MODEL: "m" },
      async () => {
        await assert.rejects(new OpenAICompatibleTextGenerationClient().generateText({ prompt: "x" }), { message: "missing_LUMINA_OPENAI_COMPATIBLE_BASE_URL" });
      },
    );

    await withFetch(
      (async () => json(200, {})) as typeof fetch,
      { LUMINA_OPENAI_COMPATIBLE_BASE_URL: "http://x/v1", LUMINA_OPENAI_COMPATIBLE_MODEL: undefined },
      async () => {
        await assert.rejects(new OpenAICompatibleTextGenerationClient().generateText({ prompt: "x" }), { message: "missing_LUMINA_OPENAI_COMPATIBLE_MODEL" });
      },
    );
  },
);
