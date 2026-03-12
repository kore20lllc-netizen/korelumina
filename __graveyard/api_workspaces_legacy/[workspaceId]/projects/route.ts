import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;

  const basePath = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects"
  );

  if (!fs.existsSync(basePath)) {
    return NextResponse.json({ projects: [] });
  }

  const projects = fs
    .readdirSync(basePath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return NextResponse.json({ projects });
}
