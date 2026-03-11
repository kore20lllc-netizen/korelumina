import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "missing projectId" }, { status: 400 });
    }

    const baseDir = path.join(process.cwd(), "projects", projectId);

    const files = await fs.readdir(baseDir, { recursive: true });

    return NextResponse.json({
      ok: true,
      files
    });

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
