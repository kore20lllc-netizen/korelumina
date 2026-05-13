import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const {
  detectProject,
} = require("@/runtime/framework-detector");

const {
  getProject,
} = require("@/runtime/preview-manager");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProjectsRoot() {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
  );
}

function isProjectFolder(projectPath: string) {
  if (!fs.existsSync(projectPath)) {
    return false;
  }

  if (!fs.statSync(projectPath).isDirectory()) {
    return false;
  }

  return (
    fs.existsSync(path.join(projectPath, "package.json")) ||
    fs.existsSync(path.join(projectPath, "index.html")) ||
    fs.existsSync(path.join(projectPath, "src")) ||
    fs.existsSync(path.join(projectPath, "app")) ||
    fs.existsSync(path.join(projectPath, "pages"))
  );
}

export async function GET() {
  try {
    const root = getProjectsRoot();

    fs.mkdirSync(root, {
      recursive: true,
    });

    const entries = fs
      .readdirSync(root)
      .filter((name) => {
        if (name.startsWith(".")) {
          return false;
        }

        if (name.endsWith(".zip")) {
          return false;
        }

        return isProjectFolder(
          path.join(root, name),
        );
      });

    const projects = entries.map((projectId) => {
      const projectPath = path.join(
        root,
        projectId,
      );

      let detected = null;

      try {
        detected = detectProject(projectPath);
      } catch (err) {
        detected = {
          framework: "unknown",
          runtime: "unknown",
          packageManager: "unknown",
          installCommand: null,
          devCommand: null,
          entry: null,
        };
      }

      const runtimeState =
        getProject(projectId);

      return {
        projectId,
        name: projectId,
        path: projectPath,

        framework:
          detected.framework,

        runtime:
          detected.runtime,

        packageManager:
          detected.packageManager,

        entry:
          detected.entry,

        status:
          runtimeState?.ready
            ? "running"
            : "stopped",

        port:
          runtimeState?.port ?? null,

        pid:
          runtimeState?.process?.pid ?? null,

        builderUrl:
          `/builder?projectId=${projectId}`,

        previewUrl:
          runtimeState?.port
            ? `http://localhost:${runtimeState.port}`
            : null,
      };
    });

    return NextResponse.json({
      ok: true,
      count: projects.length,
      projects,
    });
  } catch (err) {
    console.error("[projects api]", err);

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to list projects",
      },
      { status: 500 },
    );
  }
}
