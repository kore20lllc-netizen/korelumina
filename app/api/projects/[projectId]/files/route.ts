export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getProjectRoot(id: string) {
  return path.join(process.cwd(), "projects", id);
}

function walk(dir: string, root: string): string[] {
  let results: string[] = [];

  const ignore = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".vercel",
    "test",
  ];

  let list: string[];

  try {
    list = fs.readdirSync(dir);
  } catch {
    return [];
  }

  for (const file of list) {
    if (ignore.includes(file)) continue;

    const filePath = path.join(dir, file);

    let stat;

    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      results = results.concat(walk(filePath, root));
    } else {
      results.push(filePath.replace(root + "/", ""));
    }
  }

  return results;
}


export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const root = getProjectRoot(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const files = walk(root, root).map((p) => ({ path: p }));

  return NextResponse.json(files);
}
