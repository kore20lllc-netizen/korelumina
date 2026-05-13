import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Preview debug endpoint is active.",
    note: "esbuild inspection disabled to avoid bundling issues during production builds.",
  });
}
