import { NextRequest, NextResponse } from "next/server"
import { loadWorkspaceState } from "@/runtime/state/workspace-state"
import { resolveWorkspace } from "@/runtime/workspace-router"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return NextResponse.json({ ok:false, error:"missing projectId" })
  }

  const state = await loadWorkspaceState(projectId)

  if(!state){
    return NextResponse.json({ ok:false, error:"no workspace state" })
  }

  const workspace = resolveWorkspace(state)

  return NextResponse.json({
    ok:true,
    workspace,
    state
  })
}
