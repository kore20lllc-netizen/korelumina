import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { applyPatch } from "@/runtime/patch/applyPatch"

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, patches } = body

  if(!projectId || !patches){
    return NextResponse.json({ ok:false,error:"missing" })
  }

  const root = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  for(const p of patches){

    await applyPatch(
      root,
      p.path,
      p.content
    )

  }

  return NextResponse.json({ ok:true })

}
