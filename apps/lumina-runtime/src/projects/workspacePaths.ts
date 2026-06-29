import path from "node:path";

import {
  findUpward,
  getProjectsRoot,
  getRepoRoot,
} from "@korelumina/platform-sdk";

const PROJECT_ID_PATTERN =
  /^[a-zA-Z0-9._-]+$/;

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

export function assertSafeProjectId(
  projectId: string,
): void {
  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    throw new Error("missing_projectId");
  }

  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error("invalid_projectId");
  }
}

export function resolveProjectPath(
  projectId: string,
): string {
  assertSafeProjectId(projectId);

  const projectsRoot =
    getProjectsRoot();

  const projectPath = path.resolve(
    projectsRoot,
    projectId,
  );

  ensureWithinRoot(
    projectsRoot,
    projectPath,
    "project_path_escape_detected",
  );

  return projectPath;
}

export function ensureWithinRoot(
  root: string,
  resolvedPath: string,
  errorCode: string,
): void {
  const relative = path.relative(
    root,
    resolvedPath,
  );

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(errorCode);
  }
}

export {
  findUpward,
  getProjectsRoot,
  getRepoRoot,
};
