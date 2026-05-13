import { NextRequest, NextResponse } from "next/server";
import {
  startProject,
  getProject,
} from "@/runtime/preview-manager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const projectId =
    searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing projectId",
      },
      { status: 400 },
    );
  }

  try {
    let runtime =
      getProject(projectId);

    if (!runtime) {
      runtime =
        await startProject(
          projectId,
        );
    }

    if (!runtime) {
      return NextResponse.json(
        {
          ok: false,
          status: "crashed",
          error:
            "Preview failed to start",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "running",
      projectId:
        runtime.projectId,
      framework:
        runtime.framework,
      port:
        runtime.port,
      pid:
        runtime.pid ?? null,
      startedAt:
        runtime.startedAt ??
        null,
      uptime:
        runtime.startedAt
          ? Date.now() -
            runtime.startedAt
          : null,
    });
  } catch (err) {
    console.error(
      "[runtime API error]",
      err,
    );

    return NextResponse.json(
      {
        ok: false,
        status: "crashed",
        error:
          err instanceof Error
            ? err.message
            : "Runtime failed",
      },
      { status: 500 },
    );
  }
}
