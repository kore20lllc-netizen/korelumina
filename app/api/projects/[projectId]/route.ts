import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId" },
        { status: 400 },
      );
    }

    const root = getProjectsRoot();
    const projectPath = path.join(root, projectId);

    if (!projectPath.startsWith(root)) {
      return NextResponse.json(
        { ok: false, error: "Invalid path" },
        { status: 400 },
      );
    }

    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({
        ok: true,
        deleted: false,
        message: "Project not found",
      });
    }

    fs.rmSync(projectPath, {
      recursive: true,
      force: true,
    });

    return NextResponse.json({
      ok: true,
      deleted: true,
      projectId,
    });
  } catch (error) {
    console.error("[delete project]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete project",
      },
      { status: 500 },
    );
  }
}
