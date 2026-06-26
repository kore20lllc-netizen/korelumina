import fs from "node:fs";
import path from "node:path";

import {
  assertSafeProjectId,
  ensureWithinRoot,
  getProjectsRoot,
} from "./workspacePaths.js";

const PROJECTS_ROOT =
  getProjectsRoot();

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

  ensureWithinRoot(
    PROJECTS_ROOT,
    normalizedPath,
    "project_path_escape_detected",
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

  ensureWithinRoot(
    PROJECTS_ROOT,
    realProjectPath,
    "project_path_escape_detected",
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
