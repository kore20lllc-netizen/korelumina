import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return withCors(
      NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 })
    );
  }

  try {
    // Keep your runtime logic here if needed
    const res = NextResponse.json({
      ok: true,
      projectId,
      port: 3100,
      url: "http://localhost:3100",
      running: true,
    });

    return withCors(res);
  } catch (err: any) {
    return withCors(
      NextResponse.json(
        { ok: false, error: err?.message || "Preview failed" },
        { status: 500 }
      )
    );
  }
}

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "*");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}
