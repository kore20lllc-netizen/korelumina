import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { appendJournal } from "@/runtime/journal/fileJournal"
import { getDraft, removeDraft } from "@/runtime/drafts/fileDrafts"
import { bumpVersion } from "@/runtime/version/store"

export async function POST(req: NextRequest){

  const { projectId, draftId } = await req.json()

  const d = await getDraft(projectId,draftId)

  if(!d){
    return NextResponse.json({ ok:false })
  }

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )

  const full = path.join(root,d.path)

  await fs.mkdir(path.dirname(full),{ recursive:true })
  await fs.writeFile(full,d.content,"utf8")

  await appendJournal(projectId,{
    t: Date.now(),
    type:"fs-write",
    path:d.path
  })

  bumpVersion(projectId)

  await removeDraft(projectId,draftId)

  return NextResponse.json({ ok:true })

}
