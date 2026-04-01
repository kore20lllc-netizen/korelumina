import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "demo-project";

    // ONLY load on server runtime
    const esbuild = await import("esbuild");

    return NextResponse.json({
      ok: true,
      projectId,
      esbuildLoaded: !!esbuild
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "preview failed" },
      { status: 500 }
    );
  }
}
