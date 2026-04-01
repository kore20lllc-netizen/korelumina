import { NextRequest, NextResponse } from "next/server"
import { readDrafts } from "@/runtime/drafts/fileDrafts"

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") || "demo-project"

  const drafts = await readDrafts(projectId)

  return NextResponse.json({
    ok:true,
    drafts
  })

}
