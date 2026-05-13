import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing projectId",
      },
      { status: 400 },
    );
  }

  // Minimal stable placeholder endpoint.
  // Can be upgraded later to Server-Sent Events.
  return NextResponse.json({
    ok: true,
    projectId,
    events: [],
  });
}
