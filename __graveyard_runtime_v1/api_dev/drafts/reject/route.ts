import { NextRequest, NextResponse } from "next/server"
import { removeDraft } from "@/runtime/drafts/store"

export async function POST(req: NextRequest){

  const { projectId, draftId } = await req.json()

  removeDraft(projectId, draftId)

  return NextResponse.json({ ok:true })
}
