import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(
  process.cwd(),
  "..",
  "..",
);

const PROJECTS_ROOT = path.resolve(
  REPO_ROOT,
  "runtime",
  "workspaces",
  "default",
  "projects",
);

function assertSafeProjectId(
  projectId: string,
) {
  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    throw new Error(
      "missing_projectId",
    );
  }

  if (
    !/^[a-zA-Z0-9._-]+$/.test(
      projectId,
    )
  ) {
    throw new Error(
      "invalid_projectId",
    );
  }
}

export function getProjectPath(
  projectId: string,
) {
  assertSafeProjectId(
    projectId,
  );

  const normalizedId =
    projectId.trim();

  const candidatePath =
    path.resolve(
      PROJECTS_ROOT,
      normalizedId,
    );

  const relative =
    path.relative(
      PROJECTS_ROOT,
      candidatePath,
    );

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      "project_path_escape_detected",
    );
  }

  if (
    !fs.existsSync(candidatePath)
  ) {
    throw new Error(
      `project_not_found:${normalizedId}`,
    );
  }

  const stats =
    fs.lstatSync(candidatePath);

  if (!stats.isDirectory()) {
    throw new Error(
      "project_path_not_directory",
    );
  }

  if (stats.isSymbolicLink()) {
    throw new Error(
      "symlinked_project_not_allowed",
    );
  }

  return candidatePath;
}
