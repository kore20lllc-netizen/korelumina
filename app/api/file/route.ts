import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const workspaceId =
    searchParams.get("workspaceId") || "default";

  const projectId =
    searchParams.get("projectId");

  const file =
    searchParams.get("file");

  if (!projectId || !file) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing projectId or file",
      },
      { status: 400 },
    );
  }

  const fullPath = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId,
    file,
  );

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
    file,
    content,
  });
}
