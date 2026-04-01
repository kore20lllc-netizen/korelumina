import path from "path";

export function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

export function assertInsideProject(root: string, relPath: string) {
  const full = path.join(root, relPath);
  if (!full.startsWith(root)) {
    throw new Error("Path escape blocked");
  }
  return full;
}

const ALLOW = new Set([
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
]);

export function assertAllowedFile(relPath: string) {
  if (!ALLOW.has(relPath)) {
    throw new Error("Write blocked: file not allowed");
  }
}
