import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { GitIgnoreMatcher } from "./GitIgnore.js";
import { readGitTrackedPaths } from "./GitIndex.js";

/*
 * MS-2026-0012: every analyzer works on a snapshot, never on the live
 * directory. A snapshot is the sorted list of the repository's files with
 * their sizes and content hashes; the same commit gives the same snapshot,
 * and therefore the same manifest and audit report.
 */

export interface SnapshotFile {
  /* Repository-relative, forward slashes. */
  path: string;
  bytes: number;
  sha256: string;
  /* Text files under the read limit can be analyzed line by line. */
  text: boolean;
  /* Untracked and matched by .gitignore: present locally, not part of the repository. */
  ignored: boolean;
  /* From .git/index; null when the import is not a git checkout. */
  tracked: boolean | null;
}

export interface RepositorySnapshot {
  root: string;
  files: readonly SnapshotFile[];
  /* Hash of every path and content hash: identifies exactly what was analyzed. */
  fingerprint: string;
  /* Read from .git without running git; null when not a git checkout. */
  commit: string | null;
  /* Paths skipped because they are generated, vendored or git-ignored. */
  skippedDirectories: readonly string[];
  read(file: string): string | null;
  /*
   * Reads any text file in the snapshot from disk, environment files
   * included. Only the secret scanner uses it, and it never reports or
   * keeps what it reads: only where a secret is and what kind it is.
   */
  readSensitive(file: string): string | null;
}

export const SKIPPED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".cache",
  ".vercel",
  ".output",
  "coverage",
  ".parcel-cache",
]);

export const ENVIRONMENT_FILE = /^\.env(\..+)?$/;
export const ENVIRONMENT_TEMPLATE = /^\.env\.(example|sample|template|defaults|dist)$/;

export const MAX_TEXT_BYTES = 1_000_000;
export const MAX_FILES = 50_000;

function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, 8000);
  return sample.includes(0);
}

function readCommit(root: string): string | null {
  try {
    const head = readFileSync(path.join(root, ".git", "HEAD"), "utf8").trim();
    if (/^[0-9a-f]{40}$/.test(head)) return head;
    const ref = head.startsWith("ref: ") ? head.slice(5).trim() : null;
    if (!ref || ref.includes("..")) return null;
    try {
      const sha = readFileSync(path.join(root, ".git", ref), "utf8").trim();
      if (/^[0-9a-f]{40}$/.test(sha)) return sha;
    } catch {
      /* The ref may only be in packed-refs. */
    }
    const packed = readFileSync(path.join(root, ".git", "packed-refs"), "utf8");
    for (const line of packed.split("\n")) {
      const [sha, name] = line.trim().split(" ");
      if (name === ref && /^[0-9a-f]{40}$/.test(sha ?? "")) return sha!;
    }
  } catch {
    /* Not a git checkout, or an unreadable one. */
  }
  return null;
}

export function takeRepositorySnapshot(root: string): RepositorySnapshot {
  const absoluteRoot = path.resolve(root);
  const files: SnapshotFile[] = [];
  const texts = new Map<string, string>();
  const skipped = new Set<string>();
  const ignore = new GitIgnoreMatcher();
  const trackedPaths = readGitTrackedPaths(absoluteRoot);
  /* Ignored directories are still walked when git tracks something inside. */
  const trackedDirectories = new Set<string>();
  for (const tracked of trackedPaths ?? []) {
    let directory = path.posix.dirname(tracked);
    while (directory !== "." && !trackedDirectories.has(directory)) {
      trackedDirectories.add(directory);
      directory = path.posix.dirname(directory);
    }
  }

  const walk = (directory: string) => {
    const base = path.relative(absoluteRoot, directory).split(path.sep).join("/");
    try {
      ignore.add(base, readFileSync(path.join(directory, ".gitignore"), "utf8"));
    } catch {
      /* No .gitignore here. */
    }
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(absoluteRoot, full).split(path.sep).join("/");
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (
          SKIPPED_DIRECTORIES.has(entry.name) ||
          (ignore.ignores(relative, true) && !trackedDirectories.has(relative))
        ) {
          skipped.add(relative);
          continue;
        }
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (files.length >= MAX_FILES) {
        throw new Error(`repository_too_large:more_than_${MAX_FILES}_files`);
      }
      const bytes = statSync(full).size;
      const content = readFileSync(full);
      const text = bytes <= MAX_TEXT_BYTES && !looksBinary(content);
      /* Environment files usually hold secrets: their content is never kept. */
      if (text && (!ENVIRONMENT_FILE.test(entry.name) || ENVIRONMENT_TEMPLATE.test(entry.name))) texts.set(relative, content.toString("utf8"));
      files.push({
        path: relative,
        bytes,
        sha256: createHash("sha256").update(content).digest("hex"),
        text,
        ignored: trackedPaths?.has(relative) ? false : ignore.ignoresWithAncestors(relative, false),
        tracked: trackedPaths ? trackedPaths.has(relative) : null,
      });
    }
  };

  walk(absoluteRoot);

  /* What the repository contains: ignored local files do not change it. */
  const fingerprint = createHash("sha256")
    .update(
      files
        .filter((file) => !file.ignored)
        .map((file) => `${file.path}\0${file.sha256}`)
        .join("\n"),
    )
    .digest("hex");

  return {
    root: absoluteRoot,
    files,
    fingerprint,
    commit: readCommit(absoluteRoot),
    skippedDirectories: [...skipped].sort(),
    read: (file) => texts.get(file) ?? null,
    readSensitive: (file) => {
      const entry = files.find((candidate) => candidate.path === file);
      if (!entry || !entry.text) return null;
      try {
        return readFileSync(path.join(absoluteRoot, ...file.split("/")), "utf8");
      } catch {
        return null;
      }
    },
  };
}
