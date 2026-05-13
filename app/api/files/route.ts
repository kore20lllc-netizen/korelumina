import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getProjectRoot(
  workspaceId: string,
  projectId: string,
) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId,
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const workspaceId =
    searchParams.get("workspaceId") || "default";

  const projectId =
    searchParams.get("projectId");

  const file =
    searchParams.get("file");

  if (!projectId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing projectId",
      },
      { status: 400 },
    );
  }

  const root = getProjectRoot(
    workspaceId,
    projectId,
  );

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Project not found: ${projectId}`,
      },
      { status: 404 },
    );
  }

  // Read a single file
  if (file) {
    const fullPath = path.join(root, file);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        {
          ok: false,
          error: "File not found",
        },
        { status: 404 },
      );
    }

    const content = fs.readFileSync(
      fullPath,
      "utf8",
    );

    return NextResponse.json({
      ok: true,
      projectId,
      file,
      content,
    });
  }

  // List all files
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(
      dir,
      { withFileTypes: true },
    );

    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }

      const fullPath = path.join(
        dir,
        entry.name,
      );

      const relativePath = path
        .relative(root, fullPath)
        .replace(/\\/g, "/");

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(relativePath);
      }
    }
  }

  walk(root);
  files.sort();

  return NextResponse.json({
    ok: true,
    projectId,
    files,
  });
}
