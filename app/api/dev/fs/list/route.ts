import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const projectId =
    url.searchParams.get("projectId") ||
    "demo-project";

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
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

  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(
      dir,
      { withFileTypes: true },
    );

    for (const entry of entries) {
      const fullPath = path.join(
        dir,
        entry.name,
      );

      const relativePath = path
        .relative(root, fullPath)
        .replace(/\\/g, "/");

      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }

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
    root,
    files,
  });
}
