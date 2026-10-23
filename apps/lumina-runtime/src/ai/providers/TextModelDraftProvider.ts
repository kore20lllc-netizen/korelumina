import fs from "node:fs";
import path from "node:path";

import { walkDirectory } from "@korelumina/platform-sdk";

import { createDraft } from "../../drafts/draftStore.js";
import {
  normalizePatchPath,
  patchProblem,
  previewPatch,
} from "../../drafts/patchSafety.js";
import type { DraftPatch } from "../../drafts/types.js";
import type {
  AIProvider,
  DraftFocus,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";
import type { TextGenerationClient } from "../model/index.js";

/*
 * MS-2026-0011: one way for any text model to draft changes to a project.
 * The model sees the file the person is working in first (whole, with the
 * selected lines marked), then other source files for context. It answers
 * with a summary and patches; every patch is checked against the project
 * before it becomes part of the draft, and the ones that do not fit are
 * reported rather than silently kept or dropped. Nothing is written here:
 * the person reviews the draft and applies it.
 */

const MAX_CONTEXT_FILES = 24;
const MAX_FOCUS_CHARS = 60_000;
const MAX_FILE_CHARS = 6_000;
const MAX_CONTEXT_CHARS = 150_000;
const MAX_PATCHES = 20;

const SKIP_DIRS = [
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "coverage",
  ".venv",
  "venv",
  "target",
  "Pods",
  "vendor",
];

const TEXT_FILE =
  /\.(tsx?|jsx?|mjs|cjs|json|css|scss|sass|less|html?|md|mdx|ya?ml|toml|py|go|rs|java|kt|kts|swift|rb|php|cs|c|h|cpp|hpp|dart|vue|svelte|astro|sql|sh|gradle|xml|txt)$/i;

const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "Cargo.lock",
  "poetry.lock",
  "Gemfile.lock",
  "composer.lock",
  "go.sum",
]);

export interface ContextFile {
  path: string;
  content: string;
  truncated: boolean;
}

function readText(projectPath: string, file: string): string | null {
  try {
    const full = path.join(projectPath, file);
    const stat = fs.lstatSync(full);
    if (!stat.isFile() || stat.size > 2_000_000) return null;
    const content = fs.readFileSync(full, "utf8");
    return content.includes("\0") ? null : content;
  } catch {
    return null;
  }
}

function contextScore(file: string): number {
  if (file === "package.json" || file === "README.md") return 0;
  if (/^(src|app|pages|components|lib)\//.test(file)) return 1;
  return 2;
}

export function readDraftContext(
  projectPath: string,
  focus?: DraftFocus,
): { focus: ContextFile | null; files: ContextFile[] } {
  const all = walkDirectory(projectPath, {
    relative: true,
    skipDirectories: SKIP_DIRS,
    include: (file) =>
      TEXT_FILE.test(file) && !LOCKFILES.has(path.basename(file)) && !/(^|\/)\.env/.test(file),
  });

  const focusPath = focus ? normalizePatchPath(focus.file) : null;
  let focusFile: ContextFile | null = null;
  if (focusPath) {
    const content = readText(projectPath, focusPath);
    if (content !== null) {
      focusFile = {
        path: focusPath,
        content: content.slice(0, MAX_FOCUS_CHARS),
        truncated: content.length > MAX_FOCUS_CHARS,
      };
    }
  }

  let budget = MAX_CONTEXT_CHARS - (focusFile?.content.length ?? 0);
  const files: ContextFile[] = [];
  for (const file of [...all].sort((a, b) => contextScore(a) - contextScore(b) || a.localeCompare(b))) {
    if (files.length >= MAX_CONTEXT_FILES || budget <= 0) break;
    if (file === focusPath) continue;
    const content = readText(projectPath, file);
    if (content === null) continue;
    const slice = content.slice(0, Math.min(MAX_FILE_CHARS, budget));
    budget -= slice.length;
    files.push({ path: file, content: slice, truncated: slice.length < content.length });
  }

  return { focus: focusFile, files };
}

function numbered(content: string, focus?: DraftFocus): string {
  return content
    .split("\n")
    .map((line, index) => {
      const n = index + 1;
      const selected =
        focus?.startLine !== undefined &&
        focus.endLine !== undefined &&
        n >= focus.startLine &&
        n <= focus.endLine;
      return `${selected ? ">" : " "}${String(n).padStart(5)} | ${line}`;
    })
    .join("\n");
}

export function buildDraftPrompt(
  input: GenerateDraftInput,
  context: { focus: ContextFile | null; files: ContextFile[] },
): string {
  const focus = input.focus;
  const selection =
    context.focus && focus?.startLine !== undefined && focus.endLine !== undefined
      ? `The person selected lines ${focus.startLine}-${focus.endLine} of ${context.focus.path} (marked with ">").`
      : null;

  return [
    "You are the KoreLumina AI, editing a software project at its owner's request.",
    "Draft the smallest set of file changes that does what they asked. The person reviews your draft before anything is written.",
    "",
    "Answer with one JSON object and nothing else:",
    '{ "summary": "<one or two plain sentences on what you changed and why>", "patches": [ ... ] }',
    "",
    "Patch shapes:",
    '- { "type": "replace-text", "file": "<path>", "find": "<exact text>", "replace": "<new text>" }',
    '- { "type": "create-file", "file": "<path>", "content": "<whole file>" }',
    '- { "type": "delete-file", "file": "<path>" }',
    "",
    "Rules:",
    "- \"find\" is copied exactly from the file as shown (without the line-number gutter) and occurs exactly once in it; include enough surrounding lines to make it unique.",
    "- Use paths relative to the project root, as listed. Never touch .git, node_modules, lockfiles or .env files.",
    "- Only edit text you were shown. Do not add dependencies the project does not have.",
    "- If the request is a question rather than a change, answer it in \"summary\" and return no patches.",
    "- If you cannot do it safely, say why in \"summary\" and return no patches.",
    "",
    `Request: ${input.prompt}`,
    ...(selection ? [selection] : []),
    "",
    ...(context.focus
      ? [
          `Open file: ${context.focus.path}${context.focus.truncated ? " (truncated)" : ""}`,
          "```",
          numbered(context.focus.content, focus),
          "```",
          "",
        ]
      : []),
    "Other project files (for context):",
    ...context.files.map(
      (file) =>
        `--- ${file.path}${file.truncated ? " (truncated)" : ""}\n${file.content}`,
    ),
  ].join("\n");
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("ai_response_not_json");
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new Error("ai_response_not_json");
  }
}

function toPatch(raw: unknown): DraftPatch | string {
  if (!raw || typeof raw !== "object") return "patch_not_object";
  const patch = raw as Record<string, unknown>;
  const file = normalizePatchPath(patch.file);
  if (!file) return `unsafe_patch_path:${String(patch.file)}`;

  let built: DraftPatch;
  if (patch.type === "create-file") {
    built = { type: "create-file", file, content: String(patch.content ?? ""), diffPreview: "" };
  } else if (patch.type === "delete-file") {
    built = { type: "delete-file", file, diffPreview: "" };
  } else if (patch.type === "replace-text") {
    if (typeof patch.find !== "string" || !patch.find) return `find_missing:${file}`;
    built = {
      type: "replace-text",
      file,
      find: patch.find,
      replace: String(patch.replace ?? ""),
      diffPreview: "",
    };
  } else {
    return `unknown_patch_type:${file}`;
  }
  built.diffPreview = previewPatch(built);
  return built;
}

export function parseDraftResponse(
  text: string,
  projectPath: string,
): { summary: string; patches: DraftPatch[]; rejected: string[] } {
  const parsed = extractJson(text) as { summary?: unknown; patches?: unknown };
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const raw = Array.isArray(parsed.patches) ? parsed.patches : [];

  const patches: DraftPatch[] = [];
  const rejected: string[] = [];
  const files = new Set<string>();

  for (const item of raw.slice(0, MAX_PATCHES)) {
    const patch = toPatch(item);
    if (typeof patch === "string") {
      rejected.push(patch);
      continue;
    }
    if (files.has(patch.file)) {
      rejected.push(`file_patched_twice:${patch.file}`);
      continue;
    }
    const problem = patchProblem(projectPath, patch);
    if (problem) {
      rejected.push(problem);
      continue;
    }
    files.add(patch.file);
    patches.push(patch);
  }
  if (raw.length > MAX_PATCHES) rejected.push(`too_many_patches:${raw.length}`);

  return { summary, patches, rejected };
}

export class TextModelDraftProvider implements AIProvider {
  constructor(
    private readonly providerName: string,
    private readonly client: TextGenerationClient,
  ) {}

  async generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
    const context = readDraftContext(input.projectPath, input.focus);
    const generated = await this.client.generateText({
      prompt: buildDraftPrompt(input, context),
    });
    const { summary, patches, rejected } = parseDraftResponse(generated.text, input.projectPath);
    const draft = createDraft(input.projectId, patches);

    return {
      mode: "ai_draft",
      provider: this.providerName,
      model: generated.model,
      summary,
      rejected,
      note:
        rejected.length > 0
          ? `${rejected.length} proposed change${rejected.length === 1 ? "" : "s"} did not fit the project and ${rejected.length === 1 ? "was" : "were"} left out.`
          : undefined,
      prompt: input.prompt,
      draft,
    };
  }
}
