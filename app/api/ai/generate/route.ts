import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "@/runtime/root"

export async function POST(req:NextRequest){

  const body = await req.json()

  const projectId = body.projectId || "demo-project"

  const draftId = "draft-" + Date.now()

  const ROOT = runtimeRoot()

  const draftDir = path.join(
    ROOT,
    "drafts",
    projectId,
    draftId,
    "app",
    "components"
  )

  await fs.mkdir(draftDir,{recursive:true})

  await fs.writeFile(
    path.join(draftDir,"GeneratedNote.tsx"),
`export default function GeneratedNote(){
  return <div>AI Draft OK</div>
}
`,"utf8")

  return NextResponse.json({
    ok:true,
    draftId
  })

}
