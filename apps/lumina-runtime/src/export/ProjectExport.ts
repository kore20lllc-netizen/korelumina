import fs from "node:fs";
import path from "node:path";

import { ZipWriter } from "./ZipWriter.js";

/*
 * MS-2026-0017 (ADR-0047 Decision 2): what leaves KoreLumina when a
 * project is exported. Everything the customer owns, as it is now in
 * KoreLumina, minus what must never travel or can be rebuilt:
 *
 * - every .env file except .env.example: they hold live keys (Lovable
 *   projects can carry one), and are reported by name so the customer
 *   knows to set them up again;
 * - dependencies and build output (node_modules, dist, build, .next, ...);
 * - git internals (.git), and symbolic links and special files.
 *
 * The same selection feeds the download, a new GitHub repository and a
 * pull request, so all three carry exactly the same files.
 */

const SKIP_DIRECTORIES = new Set([
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
  ".parcel-cache",
  ".vercel",
  ".netlify",
  "coverage",
  ".venv",
  "venv",
  "__pycache__",
  "target",
  "Pods",
  ".gradle",
  ".dart_tool",
]);

const MAX_FILES = 50_000;
const MAX_BYTES = 500 * 1024 * 1024;

export interface ExportSelection {
  files: Array<{ path: string; size: number; modified: number }>;
  totalBytes: number;
  leftOutSecrets: string[];
  leftOutLinks: string[];
}

function isEnvSecret(name: string): boolean {
  return /^\.env(\..*)?$/.test(name) && name !== ".env.example";
}

export function selectExportFiles(projectPath: string): ExportSelection {
  const root = path.resolve(projectPath);
  const selection: ExportSelection = { files: [], totalBytes: 0, leftOutSecrets: [], leftOutLinks: [] };

  const walk = (relative: string) => {
    const entries = fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        selection.leftOutLinks.push(rel);
        continue;
      }
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) walk(rel);
        continue;
      }
      if (!entry.isFile()) continue;
      if (isEnvSecret(entry.name)) {
        selection.leftOutSecrets.push(rel);
        continue;
      }
      const stat = fs.lstatSync(path.join(root, rel));
      selection.files.push({ path: rel, size: stat.size, modified: stat.mtimeMs });
      selection.totalBytes += stat.size;
      if (selection.files.length > MAX_FILES) throw new Error("export_too_many_files");
      if (selection.totalBytes > MAX_BYTES) throw new Error("export_too_large");
    }
  };

  walk("");
  return selection;
}

/* Streams the selection as a zip whose entries sit under one folder named after the project. */
export function writeProjectZip(projectPath: string, folder: string, selection: ExportSelection, write: (chunk: Buffer) => void): void {
  const zip = new ZipWriter(write);
  for (const file of selection.files) {
    zip.add(`${folder}/${file.path}`, fs.readFileSync(path.join(projectPath, file.path)), new Date(file.modified));
  }
  zip.finish();
}
