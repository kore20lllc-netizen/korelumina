import path from "path";
import fs from "fs";

export function assertSafeProjectId(projectId: string) {
  // Only allow simple ids (avoid path traversal)
  if (!/^[a-zA-Z0-9-_]+$/.test(projectId)) {
    throw new Error("Invalid projectId");
  }
}

export function workspaceRoot(projectId: string) {
  assertSafeProjectId(projectId);

  // repoRoot/runtime/workspaces/<projectId>
  return path.join(process.cwd(), "runtime", "workspaces", projectId);
}

export function requirePackageJson(root: string) {
  const pkg = path.join(root, "package.json");
  if (!fs.existsSync(pkg)) {
    throw new Error(`No package.json in workspace: ${root}`);
  }
}
