import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { getDraft, removeDraft } from "@/runtime/drafts/store"

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

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    draft.projectId
  )

  const fullPath = path.join(projectRoot, draft.path)

  await fs.mkdir(path.dirname(fullPath),{ recursive:true })

  await fs.writeFile(
    fullPath,
    draft.content,
    "utf8"
  )

  removeDraft(draftId)

  return NextResponse.json({
    ok:true,
    written: draft.path
  })

}
