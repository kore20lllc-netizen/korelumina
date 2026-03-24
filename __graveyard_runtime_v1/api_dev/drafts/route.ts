import { NextRequest, NextResponse } from "next/server"
import { listDrafts } from "@/runtime/drafts/store"

export async function GET(req: NextRequest){

  const projectId =
    req.nextUrl.searchParams.get("projectId") || "demo-project"

  return NextResponse.json({
    ok:true,
    drafts: listDrafts(projectId)
  })
}
