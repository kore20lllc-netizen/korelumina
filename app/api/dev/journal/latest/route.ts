import { NextRequest, NextResponse } from "next/server"
import { getJournal } from "@/runtime/journal/store"

export async function GET(req: NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "demo-project"

  console.log("JOURNAL POLL", Date.now())

  const entries = await getJournal(projectId)

  const last =
    entries.length > 0
      ? entries[entries.length - 1]
      : null

  return NextResponse.json({
    ok:true,
    last
  })
}
