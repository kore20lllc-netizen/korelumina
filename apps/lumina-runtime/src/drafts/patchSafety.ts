import fs from "node:fs";
import path from "node:path";

import type { DraftPatch } from "./types.js";

/*
 * MS-2026-0011: the checks every draft patch passes, both when a model
 * proposes it and again just before it is written. A patch stays inside
 * the project, never goes through a symbolic link (an imported repository
 * can carry one pointing anywhere), never touches .git or node_modules,
 * and a text replacement names text that occurs exactly once, so it
 * changes the one place that was meant.
 */

const FORBIDDEN_SEGMENTS = new Set([".git", "node_modules"]);

export function normalizePatchPath(file: unknown): string | null {
  if (typeof file !== "string") return null;
  const normalized = file.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (!normalized || normalized.includes("\0")) return null;
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) return null;
  const segments = normalized.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  if (segments.some((s) => FORBIDDEN_SEGMENTS.has(s))) return null;
  return normalized;
}

export function resolveInsideProject(projectPath: string, file: string): string {
  const normalized = normalizePatchPath(file);
  if (!normalized) throw new Error(`unsafe_patch_path:${file}`);

  const root = path.resolve(projectPath);
  const full = path.resolve(root, normalized);
  const relative = path.relative(root, full);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`unsafe_patch_path:${file}`);
  }

  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(cursor);
    } catch {
      break;
    }
    if (stat.isSymbolicLink()) throw new Error(`unsafe_patch_link:${file}`);
  }

  return full;
}

export function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function readIfFile(full: string): string | null {
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(full);
  } catch {
    return null;
  }
  if (!stat.isFile()) throw new Error("patch_target_not_file");
  return fs.readFileSync(full, "utf8");
}

/** Why this patch cannot be applied to the project as it is now, or null. */
export function patchProblem(projectPath: string, patch: DraftPatch): string | null {
  try {
    const full = resolveInsideProject(projectPath, patch.file);
    const current = readIfFile(full);

    if (patch.type === "create-file") {
      return current === null ? null : `file_exists:${patch.file}`;
    }
    if (current === null) return `file_missing:${patch.file}`;
    if (patch.type === "delete-file") return null;

    const occurrences = countOccurrences(current, patch.find);
    if (occurrences === 0) return `find_not_found:${patch.file}`;
    if (occurrences > 1) return `find_not_unique:${patch.file}`;
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes(":") ? message : `${message}:${patch.file}`;
  }
}

/** A short unified-style preview, computed here rather than trusted from a model. */
export function previewPatch(patch: DraftPatch): string {
  const lines = (text: string, sign: string) =>
    text.split("\n").map((line) => `${sign}${line}`).join("\n");

  if (patch.type === "create-file") {
    return `--- /dev/null\n+++ ${patch.file}\n${lines(patch.content, "+")}`;
  }
  if (patch.type === "delete-file") {
    return `--- ${patch.file}\n+++ /dev/null`;
  }
  return `--- ${patch.file}\n+++ ${patch.file}\n${lines(patch.find, "-")}\n${lines(patch.replace, "+")}`;
}
