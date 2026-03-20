import { NextRequest, NextResponse } from "next/server"
import { getJournal } from "@/runtime/journal/store"

export async function GET(req: NextRequest){

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
}
