import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const projectId = searchParams.get("projectId");
  const entry = searchParams.get("entry");

  if (!projectId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing projectId",
      },
      { status: 400 },
    );
  }

  // Delegate to the stable preview route.
  const proxyUrl = new URL("/api/dev/preview", req.url);
  proxyUrl.searchParams.set("projectId", projectId);

  if (entry) {
    proxyUrl.searchParams.set("entry", entry);
  }

  const response = await fetch(proxyUrl.toString(), {
    cache: "no-store",
  });

  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ||
        "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
