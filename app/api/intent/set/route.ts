export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { saveIntentState } from "@/runtime/intent/state"

export async function POST(req:NextRequest){

  const body = await req.json()
  const { projectId, buildIntent, userMode } = body

  if(!projectId || !buildIntent || !userMode){
    return NextResponse.json({ ok:false, error:"missing params" }, { status:400 })
  }

  await saveIntentState(projectId, { buildIntent, userMode })

  return NextResponse.json({ ok:true })
}
