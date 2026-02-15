import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const root = process.cwd();
    const projectsDir = path.join(root, "projects");

    const status = {
      server: "ok",
      cwd: root,
      projectsDirExists: fs.existsSync(projectsDir),
      projectCount: fs.existsSync(projectsDir)
        ? fs.readdirSync(projectsDir).length
        : 0,
      time: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage().rss,
    };

    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      {
        server: "error",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
