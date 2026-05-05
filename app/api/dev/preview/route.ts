import { NextResponse } from "next/server";
const { startProject, getProject } = require("@/runtime/preview-manager");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ ok: false, error: "Missing projectId" });
  }

  const projectPath = `/Users/erictouko/dev/korelumina/runtime/workspaces/default/projects/${projectId}`;

  try {
    let project = getProject(projectId);

    // ✅ ensure project is fully started and READY
    if (!project || !project.ready) {
      project = await startProject(projectId, projectPath);
    }

    return NextResponse.json({
      ok: true,
      url: `http://localhost:${project.port}`,
    });
  } catch (err) {
    console.error("[preview API error]", err);

    return NextResponse.json({
      ok: false,
      error: "Preview failed to start",
    });
  }
}
