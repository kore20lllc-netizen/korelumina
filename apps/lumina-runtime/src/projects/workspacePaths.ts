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

/*
 * Runtime locks record which process runs each project. They are
 * operational state, never committed, and live under the gitignored
 * runtime-data root like other operational data. They used to follow
 * process.cwd(), so starting Runtime from apps/lumina-runtime left an
 * untracked runtime-locks folder in the working tree.
 */
export function getRuntimeLockRoot(): string {
  return path.join(
    getRuntimeDataRoot(),
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
