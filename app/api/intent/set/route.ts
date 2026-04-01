import { NextRequest, NextResponse } from "next/server"
import { setIntentState } from "@/runtime/intent/state"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest){

  const body = await req.json()

  const projectId =
    body.projectId || "demo-project"

  const target =
    body.target || "website"

  const mode =
    body.mode || "dev"

  await setIntentState({
    projectId,
    target,
    mode
  })

  return NextResponse.json({
    ok: true
  })
}
