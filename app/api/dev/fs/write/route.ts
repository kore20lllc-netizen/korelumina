import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { appendJournal } from "@/runtime/journal/fileJournal"
import { bumpVersion } from "@/runtime/version/store"

export async function POST(req: NextRequest){

  const { projectId, file, content } = await req.json()

  if(!projectId || !file){
    return NextResponse.json({ ok:false })
  }

  const full = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    file
  )

  await fs.mkdir(path.dirname(full),{ recursive:true })

  await fs.writeFile(full,content,"utf8")

  await appendJournal(projectId,{
    t:Date.now(),
    type:"fs-write",
    path:"app/"+file
  })

  await bumpVersion(projectId)

  return NextResponse.json({ ok:true })

}
