import path from "node:path";

import {
  assertSafeProjectId,
  ensureWithinRoot,
  findUpward,
  getProjectsRoot,
  getRepoRoot,
  resolveProjectPath,
} from "@korelumina/platform-sdk";

export function getRuntimeDataRoot(): string {
  return (
    findUpward("runtime-data") ??
    path.resolve(
      process.cwd(),
      "runtime-data",
    )
  );
}

export function getRuntimeLockRoot(): string {
  return path.resolve(
    process.cwd(),
    "runtime-locks",
  );
}

export {
  assertSafeProjectId,
  ensureWithinRoot,
  getProjectsRoot,
  getRepoRoot,
  resolveProjectPath,
};
