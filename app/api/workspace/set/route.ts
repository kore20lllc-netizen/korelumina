import { NextRequest, NextResponse } from "next/server"
import { saveWorkspaceState } from "@/runtime/state/workspace-state"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, buildType, mode } = body

  if(!projectId || !buildType || !mode){
    return NextResponse.json({ ok:false, error:"missing params" })
  }

  await saveWorkspaceState(projectId,{
    buildType,
    mode
  })

  return NextResponse.json({ ok:true })
}
