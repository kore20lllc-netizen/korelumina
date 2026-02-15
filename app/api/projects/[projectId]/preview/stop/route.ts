import { NextResponse } from "next/server";

const running: Record<string, { port: number; pid: number }> = {};

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const proc = running[projectId];

  if (!proc) {
    return NextResponse.json({ status: "not running" });
  }

  process.kill(proc.pid);

  delete running[projectId];

  return NextResponse.json({ status: "stopped" });
}
