import path from "path";
import fs from "fs";

const RUNTIME_ROOT = path.resolve(process.cwd(), "runtime/workspaces");

export function resolveWorkspacePath(workspaceId: string, projectId: string) {
  const projectRoot = path.resolve(
    RUNTIME_ROOT,
    workspaceId,
    "projects",
    projectId
  );

  if (!projectRoot.startsWith(RUNTIME_ROOT)) {
    throw new Error("Invalid project path resolution");
  }

  return projectRoot;
}

export function assertProjectExists(projectRoot: string) {
  if (!fs.existsSync(projectRoot)) {
    throw new Error("Project not found in workspace");
  }
}
