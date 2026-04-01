<<<<<<< HEAD
import fs from "fs";
import path from "path";
=======
import { NextRequest, NextResponse } from "next/server"
import { getJournal } from "@/runtime/journal/store"
>>>>>>> origin/main

export const dynamic = "force-dynamic";

<<<<<<< HEAD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "demo-project";

  const file = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "journal.json"
  );

  let entries: any[] = [];

  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      entries = JSON.parse(raw);
    }
  } catch {}

  return Response.json({ entries });
=======
  const projectId =
    req.nextUrl.searchParams.get("projectId") || "demo-project"

  const raw = await getJournal(projectId)

  const entries = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.entries)
      ? raw.entries
      : []

  return NextResponse.json({
    ok: true,
    entries
  })
>>>>>>> origin/main
}
