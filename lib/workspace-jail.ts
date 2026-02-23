import path from "path";
import fs from "fs";

const WORKSPACES_ROOT = path.join(
  process.cwd(),
  "runtime",
  "workspaces"
);

export function resolveWorkspacePath(
  workspaceId: string,
  projectId?: string
) {
  if (!projectId) {
    return path.resolve(WORKSPACES_ROOT, workspaceId);
  }

  return path.resolve(
    WORKSPACES_ROOT,
    workspaceId,
    "projects",
    projectId
  );
}

export function assertProjectExists(projectRoot: string) {
  if (!fs.existsSync(projectRoot)) {
    throw new Error("Project not found in workspace");
  }
}
