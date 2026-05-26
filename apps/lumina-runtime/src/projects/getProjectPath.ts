import path from "node:path";
import fs from "node:fs";

const REPO_ROOT = path.resolve(
  process.cwd(),
  "..",
  "..",
);

const PROJECTS_ROOT = path.join(
  REPO_ROOT,
  "runtime",
  "workspaces",
  "default",
  "projects",
);

export function getProjectPath(
  projectId: string,
) {
  const projectPath = path.join(
    PROJECTS_ROOT,
    projectId,
  );

  if (!fs.existsSync(projectPath)) {
    throw new Error(
      `Project not found: ${projectPath}`,
    );
  }

  return projectPath;
}
