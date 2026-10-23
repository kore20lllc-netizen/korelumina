import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { aiProviderStatus } from "../AIOrchestrator.js";
import type { TextGenerationClient } from "../model/index.js";
import {
  TextModelDraftProvider,
  buildDraftPrompt,
  parseDraftResponse,
  readDraftContext,
} from "../providers/TextModelDraftProvider.js";

function project(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-draft-"));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

test("the open file comes first, whole, with the selected lines marked", () => {
  const root = project({
    "package.json": "{}",
    "src/App.tsx": "line one\nline two\nline three",
    ".env.local": "SECRET=1",
    "package-lock.json": "{}",
    "node_modules/x/index.js": "x",
  });
  const context = readDraftContext(root, { file: "src/App.tsx", startLine: 2, endLine: 2 });
  assert.equal(context.focus?.path, "src/App.tsx");
  assert.deepEqual(context.files.map((f) => f.path), ["package.json"]);

  const prompt = buildDraftPrompt(
    { projectId: "p", projectPath: root, prompt: "rename two", focus: { file: "src/App.tsx", startLine: 2, endLine: 2 } },
    context,
  );
  assert.match(prompt, /Request: rename two/);
  assert.match(prompt, /selected lines 2-2 of src\/App\.tsx/);
  assert.match(prompt, />    2 \| line two/);
  assert.match(prompt, /     1 \| line one/);
  assert.doesNotMatch(prompt, /SECRET=1/);
});

test("proposed patches that do not fit the project are reported, not kept", () => {
  const root = project({ "src/App.tsx": "const a = 1;\nconst a = 1;\n", "src/b.ts": "export const b = 1;" });
  const response = "```json\n" + JSON.stringify({
    summary: "Changed b.",
    patches: [
      { type: "replace-text", file: "src/b.ts", find: "b = 1", replace: "b = 2" },
      { type: "replace-text", file: "src/App.tsx", find: "const a = 1;", replace: "x" },
      { type: "replace-text", file: "../escape.ts", find: "x", replace: "y" },
      { type: "create-file", file: "src/b.ts", content: "dup" },
      { type: "rename", file: "src/c.ts" },
    ],
  }) + "\n```";
  const parsed = parseDraftResponse(response, root);
  assert.equal(parsed.summary, "Changed b.");
  assert.deepEqual(parsed.patches.map((p) => p.file), ["src/b.ts"]);
  assert.match(parsed.patches[0].diffPreview, /^-b = 1\n\+b = 2$/m);
  assert.deepEqual(parsed.rejected, [
    "find_not_unique:src/App.tsx",
    "unsafe_patch_path:../escape.ts",
    "file_patched_twice:src/b.ts",
    "unknown_patch_type:src/c.ts",
  ]);
});

test("a reply that is not JSON fails visibly", () => {
  assert.throws(() => parseDraftResponse("Sure! Here is how...", "/tmp"), /ai_response_not_json/);
});

test("the provider turns a model reply into a draft and never writes", async () => {
  const root = project({ "src/App.tsx": "<h1>Hello</h1>" });
  let seenPrompt = "";
  const client: TextGenerationClient = {
    generateText: async (input) => {
      seenPrompt = input.prompt;
      return {
        model: "claude-test",
        text: JSON.stringify({
          summary: "Greets the world.",
          patches: [{ type: "replace-text", file: "src/App.tsx", find: "Hello", replace: "Hello, world" }],
        }),
      };
    },
  };
  const result = await new TextModelDraftProvider("anthropic", client).generateDraft({
    projectId: "p",
    projectPath: root,
    prompt: "greet the world",
    focus: { file: "src/App.tsx" },
  });
  assert.match(seenPrompt, /Open file: src\/App\.tsx/);
  assert.equal(result.provider, "anthropic");
  assert.equal(result.model, "claude-test");
  assert.equal(result.summary, "Greets the world.");
  assert.equal(result.draft.patches.length, 1);
  assert.equal(result.draft.status, "draft");
  assert.equal(fs.readFileSync(path.join(root, "src/App.tsx"), "utf8"), "<h1>Hello</h1>");
});

test("the provider status names the model and never a key", () => {
  assert.deepEqual(aiProviderStatus({ ANTHROPIC_API_KEY: "sk-secret" }), {
    provider: "anthropic",
    ready: true,
    model: "claude-sonnet-5-5",
    problem: null,
  });
  assert.equal(JSON.stringify(aiProviderStatus({ ANTHROPIC_API_KEY: "sk-secret" })).includes("sk-secret"), false);
  assert.deepEqual(aiProviderStatus({}), { provider: "rule-based", ready: true, model: null, problem: null });
  assert.deepEqual(aiProviderStatus({ LUMINA_AI_PROVIDER: "anthropic" }), {
    provider: "anthropic",
    ready: false,
    model: "claude-sonnet-5-5",
    problem: "missing_ANTHROPIC_API_KEY",
  });
  assert.equal(aiProviderStatus({ LUMINA_AI_PROVIDER: "gemini" }).problem, "unsupported_ai_provider:gemini");
});
