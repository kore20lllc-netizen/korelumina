import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getProjectRoot(projectId: string) {
  return path.join(process.cwd(), "runtime", "projects", projectId);
}

export async function POST(
  request: Request,
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

  return NextResponse.json({
    ok: true,
    projectId,
    root,
  });
}
