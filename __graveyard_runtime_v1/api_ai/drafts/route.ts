import { NextRequest, NextResponse } from "next/server"
import { listDrafts } from "@/runtime/drafts/store"

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") ||
    "demo-project"

  const drafts = listDrafts(projectId)

  return NextResponse.json({
    ok:true,
    drafts
  })

}
