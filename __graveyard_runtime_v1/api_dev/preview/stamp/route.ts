import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "missing projectId" }, { status: 400 });
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const candidates = [
    path.join(projectRoot, "app", "page.tsx"),
    path.join(projectRoot, "app", "page.ts"),
    path.join(projectRoot, "src", "app", "page.tsx"),
    path.join(projectRoot, "src", "app", "page.ts"),
  ];

  const existing = candidates.find((p) => fs.existsSync(p));

  if (!existing) {
    return NextResponse.json({
      ok: true,
      projectId,
      stamp: "no-entry"
    });
  }

  const stat = fs.statSync(existing);

  return NextResponse.json({
    ok: true,
    projectId,
    stamp: String(stat.mtimeMs),
    entry: existing
  });
}
