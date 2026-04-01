import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { getDraft, removeDraft } from "@/runtime/drafts/store"
import { pushEntry } from "@/runtime/journal/store"

export async function POST(req: NextRequest){

  const { projectId, draftId } = await req.json()

  const d = getDraft(projectId, draftId)

  if(!d){
    return NextResponse.json({ ok:false, error:"draft not found" })
  }

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  )

  const full = path.join(root, d.path)

  await fs.mkdir(path.dirname(full),{ recursive:true })
  await fs.writeFile(full, d.content, "utf8")

  // fs write journal
  pushEntry(projectId,{
    t:Date.now(),
    type:"fs-write",
    path:d.path
  })

  // canonical preview reload signal
  pushEntry(projectId,{
    t:Date.now(),
    type:"preview-reload"
  })

  removeDraft(projectId, draftId)

  return NextResponse.json({ ok:true })
}
