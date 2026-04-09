import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoUrl: string = body.repoUrl;

    if (!repoUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing repoUrl" },
        { status: 400 }
      );
    }

    // 🔥 Generate projectId from repo name
    const repoName = repoUrl
      .split("/")
      .pop()
      ?.replace(".git", "") || "imported-project";

    const projectId = repoName + "-" + Date.now();

    const projectsRoot = path.join(
      process.cwd(),
      "runtime/workspaces/default/projects"
    );

    const projectPath = path.join(projectsRoot, projectId);

    // ensure root exists
    fs.mkdirSync(projectsRoot, { recursive: true });

    // 🔥 clone repo
    execSync(`git clone ${repoUrl} ${projectPath}`, {
      stdio: "inherit",
    });

    return NextResponse.json({
      ok: true,
      projectId,
      path: projectPath,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Import failed",
      },
      { status: 500 }
    );
  }
}
