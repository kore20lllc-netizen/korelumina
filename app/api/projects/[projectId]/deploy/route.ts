import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProjectRoot(id: string) {
  return path.join(process.cwd(), "projects", id);
}

export async function POST(
  req: Request,
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

  try {
    // 1. Install deps
    execSync("npm install", {
      cwd: root,
      stdio: "inherit",
    });

    // 2. Build
    execSync("npm run build", {
      cwd: root,
      stdio: "inherit",
    });

    // 3. Deploy to Vercel
    const output = execSync("npx vercel --prod --yes", {
      cwd: root,
      encoding: "utf-8",
    });

    // Extract URL
    const match = output.match(/https:\/\/[^\s]+/);
    const url = match ? match[0] : null;

    return NextResponse.json({
      status: "deployed",
      url,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: err.message || "Deploy failed" },
      { status: 500 }
    );
  }
}
