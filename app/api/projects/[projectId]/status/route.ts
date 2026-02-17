import { NextResponse } from "next/server";
import { workspaceRoot, assertSafeProjectId } from "@/lib/runtime/paths";
import path from "path";
import fs from "fs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await ctx.params;
  assertSafeProjectId(projectId);

  const root = workspaceRoot(projectId);
  const logPath = path.join(root, "build.log");

  const exists = fs.existsSync(logPath);
  const logSize = exists ? fs.statSync(logPath).size : 0;

  // Minimal status for now (Phase 3 will add PID + stale lock)
  return NextResponse.json({
    projectId,
    root,
    running: false,
    logPath,
    logSize
  });
}
