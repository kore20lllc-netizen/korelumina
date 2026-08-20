import path from "node:path";

import {
  assertSafeProjectId,
  ensureWithinRoot,
  getProjectsRoot,
  getRepoRoot,
  resolveProjectPath,
} from "@korelumina/platform-sdk";

export function getRuntimeDataRoot(): string {
  /*
   * Operational Runtime data has one canonical repository-level root.
   *
   * Do not make its identity depend on:
   * - process.cwd();
   * - whether runtime-data already exists at process startup;
   * - which workspace launched the Runtime process.
   *
   * Genesis, Knowledge Operations, and all other Runtime consumers must
   * resolve the same production storage location deterministically.
   */
  return path.join(
    getRepoRoot(),
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
