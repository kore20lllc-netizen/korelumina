import fs from "node:fs";
import path from "node:path";

export function ensureParentDirectory(
  filePath: string,
) {
  fs.mkdirSync(
    path.dirname(filePath),
    {
      recursive: true,
    },
  );
}

export function normalizePath(
  value: string,
) {
  return path.normalize(value);
}

export function safeJoin(
  ...parts: string[]
) {
  return path.join(...parts);
}
