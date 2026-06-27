import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { getRepoRoot } from "../../projects/workspacePaths.js";
import type { ArchitectureDocument } from "./types.js";

const ARCHITECTURE_ROOT = path.join(
  getRepoRoot(),
  "docs",
  "architecture",
);

function walk(
  dir: string,
  output: ArchitectureDocument[],
) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, output);
      continue;
    }

    if (!entry.name.endsWith(".md")) {
      continue;
    }

    const stat = fs.statSync(full);
    const buffer = fs.readFileSync(full);

    output.push({
      id: crypto
        .createHash("sha256")
        .update(path.relative(ARCHITECTURE_ROOT, full))
        .digest("hex"),
      path: full,
      relativePath: path.relative(ARCHITECTURE_ROOT, full),
      checksum: crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex"),
      size: stat.size,
      modifiedAt: stat.mtimeMs,
    });
  }
}

export function discoverArchitectureDocuments() {
  if (!fs.existsSync(ARCHITECTURE_ROOT)) {
    return [];
  }

  const documents: ArchitectureDocument[] = [];

  walk(ARCHITECTURE_ROOT, documents);

  documents.sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath),
  );

  return documents;
}
