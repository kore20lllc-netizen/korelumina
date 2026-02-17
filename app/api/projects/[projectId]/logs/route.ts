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

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ logs: [] });
  }

  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.split("\n").slice(-100);

  return NextResponse.json({ logs: lines });
}
