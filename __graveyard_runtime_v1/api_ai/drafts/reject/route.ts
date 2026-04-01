import { NextRequest, NextResponse } from "next/server"
import { removeDraft, getDraft } from "@/runtime/drafts/store"

export async function POST(req: NextRequest){

  const body = await req.json()

  const draftId = body.draftId

  if(!draftId){
    return NextResponse.json({ ok:false, error:"missing draftId" })
  }

  const draft = getDraft(draftId)

  if(!draft){
    return NextResponse.json({ ok:false, error:"draft not found" })
  }

  removeDraft(draftId)

  return NextResponse.json({
    ok:true,
    rejected:draftId
  })

}
