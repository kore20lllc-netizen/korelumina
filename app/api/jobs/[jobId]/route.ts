import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  return NextResponse.json({
    ok: true,
    jobId,
  });
}
