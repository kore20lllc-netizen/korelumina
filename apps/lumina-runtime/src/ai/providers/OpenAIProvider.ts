import fs from "node:fs";
import path from "node:path";

import {
  walkDirectory,
} from "@korelumina/platform-sdk";

import { auditProject } from "../../audit/auditProject.js";
import { generateFixPlan } from "../../autofix/generateFixPlan.js";
import { createDraft } from "../../drafts/draftStore.js";
import type { DraftPatch } from "../../drafts/types.js";
import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

import {
  OpenAITextGenerationClient,
} from "../model/index.js";

const MAX_FILES = 24;
const MAX_FILE_CHARS = 6000;

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "coverage",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".md",
  ".env.example",
]);

function isTextFile(file: string): boolean {
  if (file.endsWith(".env.example")) return true;
  return TEXT_EXTENSIONS.has(path.extname(file));
}

function safeJoin(projectPath: string, file: string): string {
  const full = path.resolve(projectPath, file);
  const relative = path.relative(projectPath, full);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`unsafe_ai_context_path:${file}`);
  }

  return full;
}

function walkFiles(
  projectPath: string,
): string[] {
  return walkDirectory(
    projectPath,
    {
      relative: true,
      skipDirectories: [
        ".git",
        "node_modules",
        ".next",
        "dist",
        "build",
        ".turbo",
        ".cache",
        "coverage",
      ],
      include: isTextFile,
    },
  );
}

function readContextFiles(projectPath: string): Array<{
  path: string;
  content: string;
}> {
  return walkFiles(projectPath)
    .sort((a, b) => {
      const score = (file: string) => {
        if (file === "package.json") return 0;
        if (file.includes("app/")) return 1;
        if (file.includes("src/")) return 2;
        return 3;
      };

      return score(a) - score(b) || a.localeCompare(b);
    })
    .slice(0, MAX_FILES)
    .map((file) => {
      const full = safeJoin(projectPath, file);
      const content = fs.readFileSync(full, "utf8");

      return {
        path: file,
        content: content.slice(0, MAX_FILE_CHARS),
      };
    });
}

function parsePatches(text: string): DraftPatch[] {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const patches = Array.isArray(parsed?.patches) ? parsed.patches : [];

  return patches
    .filter((patch: any) => {
      if (!patch || typeof patch.file !== "string") return false;
      return ["create-file", "replace-text", "delete-file"].includes(patch.type);
    })
    .map((patch: any) => {
      if (patch.type === "create-file") {
        return {
          type: "create-file",
          file: patch.file,
          content: String(patch.content ?? ""),
          diffPreview: String(patch.diffPreview ?? `+++ ${patch.file}`),
        } satisfies DraftPatch;
      }

      if (patch.type === "delete-file") {
        return {
          type: "delete-file",
          file: patch.file,
          diffPreview: String(patch.diffPreview ?? `--- ${patch.file}\n+++ /dev/null`),
        } satisfies DraftPatch;
      }

      return {
        type: "replace-text",
        file: patch.file,
        find: String(patch.find ?? ""),
        replace: String(patch.replace ?? ""),
        diffPreview: String(patch.diffPreview ?? `--- ${patch.file}\n+++ ${patch.file}`),
      } satisfies DraftPatch;
    })
    .filter((patch: DraftPatch) => {
      if (patch.type === "replace-text") {
        return patch.find.length > 0;
      }

      return true;
    });
}

function buildPrompt(input: GenerateDraftInput, files: Array<{ path: string; content: string }>): string {
  return [
    "You are KoreLumina Runtime AI.",
    "Generate safe draft patches for the user's imported project.",
    "Return JSON only. No markdown. No commentary.",
    "",
    "Allowed patch types:",
    "- create-file: { type, file, content, diffPreview }",
    "- replace-text: { type, file, find, replace, diffPreview }",
    "- delete-file: { type, file, diffPreview }",
    "",
    "Rules:",
    "- Never write outside the project.",
    "- Prefer small targeted patches.",
    "- For replace-text, find must exactly exist in the provided file content.",
    "- Do not invent dependency installs.",
    "- Do not edit lockfiles unless explicitly requested.",
    "",
    `Project ID: ${input.projectId}`,
    `User prompt: ${input.prompt}`,
    "",
    "Project files:",
    JSON.stringify(files, null, 2),
    "",
    "Return exactly:",
    "{ \"patches\": [ ... ] }",
  ].join("\n");
}

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly textClient =
      new OpenAITextGenerationClient(),
  ) {}

  async generateDraft(
    input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    const report = auditProject(
      input.projectId,
      input.projectPath,
    );

    const plan = generateFixPlan(
      report,
    );

    const files = readContextFiles(
      input.projectPath,
    );

    const generated =
      await this.textClient
        .generateText({
          prompt:
            buildPrompt(
              input,
              files,
            ),
        });

    const patches =
      parsePatches(
        generated.text,
      );

    const draft = createDraft(
      input.projectId,
      patches,
    );

    return {
      mode: "openai_draft",
      note: `OpenAIProvider generated ${patches.length} patch${patches.length === 1 ? "" : "es"} using ${generated.model}.`,
      prompt: input.prompt,
      report,
      plan,
      draft,
    };
  }
}
