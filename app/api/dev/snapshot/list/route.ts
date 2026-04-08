import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId" });
    }

    const dir = path.join(
      process.cwd(),
      "runtime/snapshots",
      projectId
    );

    if (!fs.existsSync(dir)) {
      return NextResponse.json({ ok: true, snapshots: [] });
    }

    const snapshots = fs.readdirSync(dir).sort().reverse();

    return NextResponse.json({
      ok: true,
      snapshots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
