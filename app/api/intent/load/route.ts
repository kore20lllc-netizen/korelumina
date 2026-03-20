export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { loadIntentState } from "@/runtime/intent/state"
import { resolveIntentRoute } from "@/runtime/intent/router"

export async function GET(req:NextRequest){

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if(!projectId){
    return NextResponse.json({ ok:false, error:"missing projectId" }, { status:400 })
  }

  const state = await loadIntentState(projectId)

  if(!state){
    return NextResponse.json({ ok:false, error:"no intent state" }, { status:404 })
  }

  return NextResponse.json({
    ok:true,
    state,
    route: resolveIntentRoute(projectId, state)
  })
}
