import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing projectId",
        },
        { status: 400 },
      );
    }

    const snapshotsDir = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId,
      ".korelumina",
      "snapshots",
    );

    if (!fs.existsSync(snapshotsDir)) {
      return NextResponse.json({
        ok: true,
        projectId,
        snapshots: [],
      });
    }

    const snapshots = fs
      .readdirSync(snapshotsDir, {
        withFileTypes: true,
      })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const fullPath = path.join(
          snapshotsDir,
          entry.name,
        );

        const stats = fs.statSync(fullPath);

        return {
          id: entry.name,
          name: entry.name,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) =>
        b.modifiedAt.localeCompare(a.modifiedAt),
      );

    return NextResponse.json({
      ok: true,
      projectId,
      snapshots,
    });
  } catch (err) {
    console.error(
      "[snapshot list error]",
      err,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to list snapshots",
      },
      { status: 500 },
    );
  }
}
