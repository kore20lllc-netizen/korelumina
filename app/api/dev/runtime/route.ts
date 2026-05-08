import { NextResponse } from "next/server";

const {
  getProject,
  startProject,
} = require("@/runtime/preview-manager");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const projectId =
    searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({
      ok: false,
      error: "Missing projectId",
    });
  }

  const projectPath =
    `/Users/erictouko/dev/korelumina/runtime/workspaces/default/projects/${projectId}`;

  try {
    let runtime =
      getProject(projectId);

    // auto boot runtime if missing
    if (!runtime) {
      runtime =
        await startProject(
          projectId,
          projectPath,
        );
    }

    if (!runtime) {
      return NextResponse.json({
        ok: false,
        status: "stopped",
      });
    }

    return NextResponse.json({
      ok: true,

      status:
        runtime.ready
          ? "running"
          : "booting",

      projectId:
        runtime.projectId,

      framework:
        runtime.framework,

      port:
        runtime.port,

      pid:
        runtime.process?.pid,

      startedAt:
        runtime.startedAt,

      uptime:
        Date.now() -
        runtime.startedAt,
    });
  } catch (err) {
    console.error(
      "[runtime route]",
      err,
    );

    return NextResponse.json({
      ok: false,
      status: "crashed",
      error:
        err instanceof Error
          ? err.message
          : "Runtime failed",
    });
  }
}
