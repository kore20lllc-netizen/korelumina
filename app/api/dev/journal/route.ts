import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const projectId =
    searchParams.get("projectId") || "demo-project";

  const file = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    ".korelumina",
    "journal.json",
  );

  if (!fs.existsSync(file)) {
    return NextResponse.json({
      ok: true,
      entries: [],
    });
  }

  try {
    const raw = fs.readFileSync(
      file,
      "utf8",
    );

    const entries =
      JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      entries:
        Array.isArray(entries)
          ? entries
          : [],
    });
  } catch {
    return NextResponse.json({
      ok: true,
      entries: [],
    });
  }
}
