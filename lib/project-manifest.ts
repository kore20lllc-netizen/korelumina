import fs from "fs";
import path from "path";

export interface ManifestCommand {
  cmd: string;
  args: string[];
}

export interface ProjectManifest {
  name: string;
  framework: string;
  commands: {
    build: ManifestCommand;
    preview: ManifestCommand;
  };
}

export function ensureManifest(workspaceId: string, projectId: string): ProjectManifest {
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

  const manifestPath = path.join(projectRoot, "korelumina.manifest.json");

  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  const manifest: ProjectManifest = {
    name: projectId,
    framework: "vite",
    commands: {
      build: { cmd: "npm", args: ["run", "build"] },
      preview: {
        cmd: "npm",
        args: ["run", "dev", "--", "--host", "0.0.0.0", "--port", "$PORT"],
      },
    },
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

export function resolveManifestCommand(
  manifest: ProjectManifest,
  type: "build" | "preview",
  port?: number
): ManifestCommand {
  const command = manifest.commands[type];

  if (!command) {
    throw new Error(`Command '${type}' not defined in manifest`);
  }

  if (type === "preview" && port) {
    return {
      cmd: command.cmd,
      args: command.args.map((a) =>
        a === "$PORT" ? String(port) : a
      ),
    };
  }

  return command;
}
