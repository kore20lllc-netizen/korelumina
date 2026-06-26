import fs from "node:fs";
import path from "node:path";

const PROJECT_ID_PATTERN =
  /^[a-zA-Z0-9._-]+$/;

function findUpward(
  target: string,
): string | null {
  let current = process.cwd();

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(
      current,
      target,
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  return null;
}

export function getRepoRoot(): string {
  return path.resolve(
    process.cwd(),
    "..",
    "..",
  );
}

export function getProjectsRoot(): string {
  return (
    findUpward(
      path.join(
        "runtime",
        "workspaces",
        "default",
        "projects",
      ),
    ) ??
    path.resolve(
      getRepoRoot(),
      "runtime",
      "workspaces",
      "default",
      "projects",
    )
  );
}

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
