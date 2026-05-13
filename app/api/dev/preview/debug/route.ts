import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Load esbuild at runtime only, and only use serializable fields.
    const esbuild = await import("esbuild");

    return NextResponse.json({
      ok: true,
      version: esbuild.version,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load esbuild",
      },
      { status: 500 },
    );
  }
}
