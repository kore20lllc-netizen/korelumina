import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "@/runtime/root"

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, draftId } = body

  const ROOT = runtimeRoot()

  const draftDir = path.join(
    ROOT,
    "drafts",
    projectId,
    draftId
  )

  try{
    await fs.access(draftDir)
  }catch{
    return NextResponse.json({ ok:false, error:"draft not found in diff" })
  }

  return NextResponse.json({
    ok:true,
    diffs:[
      { path:"app/components/GeneratedNote.tsx", patch:"mock" },
      { path:"app/page.tsx", patch:"mock" }
    ]
  })

}
