import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  return NextResponse.json({
    ok: true,
    projectId,
    message: "Commit endpoint placeholder",
  });
}
