import { NextResponse } from "next/server";

const {
  startProject,
  getProject,
} = require("../../../../runtime/preview-manager");

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const projectId =
      searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing projectId",
        },
        { status: 400 }
      );
    }

    let runtime =
      getProject(projectId);

    if (!runtime) {
      runtime =
        await startProject(
          projectId
        );
    }

    if (!runtime) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime unavailable",
        },
        { status: 500 }
      );
    }

    if (
      runtime.status === "crashed"
    ) {
      return NextResponse.json(
        {
          ok: false,
          status: "crashed",
          error:
            runtime.error ||
            "Runtime crashed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      projectId,
      framework:
        runtime.framework,
      port: runtime.port,
      url: `http://localhost:${runtime.port}`,
    });
  } catch (err: any) {
    console.error(
      "[preview API error]",
      err
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ||
          "Preview failed",
      },
      { status: 500 }
    );
  }
}
