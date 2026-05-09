import { NextResponse } from "next/server";

const {
  getProject,
  startProject,
} = require("@/runtime/preview-manager");

export async function GET(
  request: Request,
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const projectId =
      searchParams.get(
        "projectId",
      );

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing projectId",
        },
        { status: 400 },
      );
    }

    // Reuse existing runtime if it is already running.
    let runtime =
      getProject(projectId);

    // Only boot a new runtime if none exists.
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
          error:
            "Preview failed to start",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      projectId:
        runtime.projectId,
      framework:
        runtime.framework,
      port:
        runtime.port,
      url:
        `http://localhost:${runtime.port}`,
    });
  } catch (err) {
    console.error(
      "[preview API error]",
      err,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Preview failed",
      },
      { status: 500 },
    );
  }
}
