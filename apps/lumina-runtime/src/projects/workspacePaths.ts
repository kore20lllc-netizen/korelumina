import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  assertSafeProjectId,
  ensureWithinRoot,
  getProjectsRoot,
  getRepoRoot,
  resolveProjectPath,
} from "@korelumina/platform-sdk";

const RUNTIME_REPOSITORY_ROOT =
  path.resolve(
    path.dirname(
      fileURLToPath(
        import.meta.url,
      ),
    ),
    "..",
    "..",
    "..",
    "..",
  );

export function getRuntimeDataRoot(): string {
  /*
   * Operational Runtime data has one canonical repository-level root.
   *
   * This is deliberately module-relative rather than process-relative.
   * Runtime servers, build output, tests, maintenance scripts, and
   * governed operational tools therefore resolve the same location
   * regardless of process.cwd().
   */
  return path.join(
    RUNTIME_REPOSITORY_ROOT,
    "runtime-data",
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
