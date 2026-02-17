import fs from "fs";
import path from "path";

export type ProjectType = "app" | "website";

export type ProjectManifest = {
  type: ProjectType;
  framework?: string; // e.g. "nextjs" | "vite"
  mode?: string; // e.g. "static" | "dynamic"
  createdWith?: string; // "korelumina"
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
};

const DEFAULT_MANIFEST: ProjectManifest = {
  type: "app",
  framework: "unknown",
  mode: "dynamic",
  createdWith: "korelumina",
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function getManifestPath(workspaceProjectRoot: string) {
  // workspaceProjectRoot is the jailed project root (not repo root)
  return path.join(workspaceProjectRoot, "project.json");
}

export function readManifest(workspaceProjectRoot: string): ProjectManifest {
  const manifestPath = getManifestPath(workspaceProjectRoot);

  if (!fs.existsSync(manifestPath)) {
    return { ...DEFAULT_MANIFEST };
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ProjectManifest>;

    const type: ProjectType =
      parsed.type === "website" ? "website" : "app";

    return {
      ...DEFAULT_MANIFEST,
      ...parsed,
      type,
    };
  } catch {
    // If corrupted, fall back safely
    return { ...DEFAULT_MANIFEST };
  }
}

export function writeManifest(
  workspaceProjectRoot: string,
  next: ProjectManifest
) {
  const manifestPath = getManifestPath(workspaceProjectRoot);
  ensureDir(path.dirname(manifestPath));

  const now = new Date().toISOString();

  const prev = readManifest(workspaceProjectRoot);

  const merged: ProjectManifest = {
    ...prev,
    ...next,
    type: next.type === "website" ? "website" : "app",
    createdAt: prev.createdAt ?? now,
    updatedAt: now,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

export function ensureManifest(workspaceProjectRoot: string) {
  const manifestPath = getManifestPath(workspaceProjectRoot);
  if (!fs.existsSync(manifestPath)) {
    return writeManifest(workspaceProjectRoot, { ...DEFAULT_MANIFEST });
  }
  return readManifest(workspaceProjectRoot);
}
