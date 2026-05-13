import { NextResponse } from "next/server";

const {
  importRepo,
} = require("@/runtime/repo-importer");

const {
  detectProject,
} = require("@/runtime/framework-detector");

export async function POST(req: Request) {
  try {
    const body =
      await req.json();

    const repoUrl =
      body?.repoUrl;

    const projectId =
      body?.projectId;

    const imported =
      await importRepo({
        repoUrl,
        projectId,
      });

    const detected =
      detectProject(
        imported.projectPath,
      );

    return NextResponse.json({
      ok: true,
      action:
        imported.action,
      projectId:
        imported.projectId,
      repo:
        imported.repo,
      project:
        detected,
      builderUrl:
        `/builder?projectId=${imported.projectId}`,
    });
  } catch (err) {
    console.error(
      "[repo import]",
      err,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Repo import failed",
      },
      { status: 500 },
    );
  }
}
