import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const {
  normalizeProjectId,
} = require("@/runtime/repo-importer");

const {
  detectProject,
} = require("@/runtime/framework-detector");

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

function removeUnsafeImportedArtifacts(projectPath: string) {
  const targets = [
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".vite",
  ];

  for (const target of targets) {
    fs.rmSync(path.join(projectPath, target), {
      recursive: true,
      force: true,
    });
  }
}

function flattenSingleNestedFolder(projectPath: string) {
  const entries = fs.readdirSync(projectPath);

  if (entries.length !== 1) {
    return;
  }

  const nestedPath = path.join(
    projectPath,
    entries[0],
  );

  if (!fs.statSync(nestedPath).isDirectory()) {
    return;
  }

  const nestedFiles = fs.readdirSync(nestedPath);

  for (const item of nestedFiles) {
    fs.renameSync(
      path.join(nestedPath, item),
      path.join(projectPath, item),
    );
  }

  fs.rmSync(nestedPath, {
    recursive: true,
    force: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing ZIP file",
        },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only .zip files are supported",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer(),
    );

    const baseName = file.name.replace(/\.zip$/i, "");

    const projectId =
      normalizeProjectId(baseName);

    const projectPath = path.join(
      getProjectsRoot(),
      projectId,
    );

    fs.rmSync(projectPath, {
      recursive: true,
      force: true,
    });

    fs.mkdirSync(projectPath, {
      recursive: true,
    });

    const zip = new AdmZip(buffer);

    zip.extractAllTo(projectPath, true);

    flattenSingleNestedFolder(projectPath);

    // Critical:
    // Never trust uploaded node_modules/build artifacts.
    // They can contain broken permissions, platform-specific binaries,
    // stale builds, or unsafe generated files.
    removeUnsafeImportedArtifacts(projectPath);

    const detected =
      detectProject(projectPath);

    return NextResponse.json({
      ok: true,
      action: "uploaded",
      projectId,
      projectPath,
      project: detected,
      builderUrl:
        `/builder?projectId=${projectId}`,
    });
  } catch (error) {
    console.error("[import-zip]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "ZIP import failed",
      },
      { status: 500 },
    );
  }
}
