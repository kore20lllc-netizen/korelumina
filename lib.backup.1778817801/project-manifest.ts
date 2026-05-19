import fs from "fs";
import path from "path";

export interface ProjectManifest {
  name: string;
  build: string;
  dev: string;
}

export function ensureManifest(
  workspaceId: string,
  projectId: string
): ProjectManifest {
  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );

  if (!fs.existsSync(projectRoot)) {
    throw new Error("Project not found in workspace");
  }

  const manifestPath = path.join(
    projectRoot,
    "korelumina.manifest.json"
  );

  if (fs.existsSync(manifestPath)) {
    return JSON.parse(
      fs.readFileSync(manifestPath, "utf8")
    );
  }

  const manifest: ProjectManifest = {
    name: projectId,
    build: "npm run build",
    dev: "npm run dev"
  };

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  return manifest;
}

export function resolveManifestCommand(
  manifest: ProjectManifest,
  type: "build" | "dev"
) {
  const command = type === "build" ? manifest.build : manifest.dev;

  const parts = command.split(" ");
  const cmd = parts[0];
  const args = parts.slice(1);

  return { cmd, args };
}
