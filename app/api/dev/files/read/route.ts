import { ensureProjectRoot } from "@/runtime/fs/ensureProjectRoot";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const filePath = req.nextUrl.searchParams.get("path");

    if (!projectId || !filePath) {
      return NextResponse.json({ ok: false, error: "missing params" });
    }

    const full = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId,
      filePath
    );

    try {
      const content = await fs.readFile(full, "utf8");
      return NextResponse.json({ ok: true, content });
    } catch {
      return NextResponse.json({ ok: false, error: "file not found", full });
    }

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" });
  }
}
