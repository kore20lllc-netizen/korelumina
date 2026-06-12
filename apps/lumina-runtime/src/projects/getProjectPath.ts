import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(
  process.cwd(),
  "..",
  "..",
);

const PROJECTS_ROOT = path.resolve(
  path.join(
    REPO_ROOT,
    "runtime",
    "workspaces",
    "default",
    "projects",
  ),
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

function ensureWithinProjectsRoot(
  resolvedPath: string,
) {
  const relative = path.relative(
    PROJECTS_ROOT,
    resolvedPath,
  );

  const escaped =
    relative.startsWith("..") ||
    path.isAbsolute(relative);

  if (escaped) {
    throw new Error(
      "project_path_escape_detected",
    );
  }
}

export function getProjectPath(
  projectId: string,
) {
  assertSafeProjectId(
    projectId,
  );

  const joinedPath = path.join(
    PROJECTS_ROOT,
    projectId,
  );

  const normalizedPath =
    path.resolve(joinedPath);

  ensureWithinProjectsRoot(
    normalizedPath,
  );

  if (
    !fs.existsSync(
      normalizedPath,
    )
  ) {
    throw new Error(
      `project_not_found:${projectId}`,
    );
  }

  const realProjectPath =
    fs.realpathSync(
      normalizedPath,
    );

  ensureWithinProjectsRoot(
    realProjectPath,
  );

  const stats =
    fs.statSync(
      realProjectPath,
    );

  if (!stats.isDirectory()) {
    throw new Error(
      "project_path_not_directory",
    );
  }

  return realProjectPath;
}
