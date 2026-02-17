import { NextResponse } from "next/server";
import { workspaceRoot, requirePackageJson, assertSafeProjectId } from "@/lib/runtime/paths";
import path from "path";
import fs from "fs";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await ctx.params;
  assertSafeProjectId(projectId);

  const root = workspaceRoot(projectId);
  const logPath = path.join(root, "build.log");

  try {
    requirePackageJson(root);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Missing package.json", root },
      { status: 400 }
    );
  }

  ensureDir(root);

  // Fire-and-forget build script (writes to build.log)
  // NOTE: this endpoint only starts build. status/logs endpoints read the log.
  const { spawn } = await import("child_process");

  const child = spawn("bash", ["./scripts/build-project.sh", projectId], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "ignore", "ignore"],
    detached: true
  });

  child.unref();

  return NextResponse.json({ ok: true, projectId, root, logPath });
}
