import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const logPath = path.join(
    process.cwd(),
    "runtime",
    "projects",
    projectId,
    "watchdog.log"
  );

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ logs: [] });
  }

  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.split("\n").slice(-100);

  return NextResponse.json({ logs: lines });
}
